/* eslint-disable max-lines */
/* eslint-disable max-statements */
import React, { useEffect, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import {
  LoaderFunction,
  useLoaderData,
  useLocation,
  useRevalidator,
  useSearchParams,
} from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { useSetRecoilState } from 'recoil';
import * as extractorsAPI from 'app/V2/api/ix/extractors';
import * as suggestionsAPI from 'app/V2/api/ix/suggestions';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { Button, Paginator, Table } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { IXExtractorInfo } from 'app/V2/shared/types';
import { ClientTemplateSchema } from 'app/istore';
import { notificationAtom } from 'app/V2/atoms';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { socket } from 'app/socket';
import { SuggestionsTitle } from './components/SuggestionsTitle';
import { FiltersSidepanel } from './components/FiltersSidepanel';
import { suggestionsTableColumnsBuilder } from './components/TableElements';
import { PDFSidepanel } from './components/PDFSidepanel';

const SUGGESTIONS_PER_PAGE = 10;

type ixStatus =
  | 'ready'
  | 'sending_labeled_data'
  | 'processing_model'
  | 'processing_suggestions'
  | 'cancel'
  | 'error';

const ixmessages = {
  ready: 'Find suggestions',
  sending_labeled_data: 'Sending labeled data...',
  processing_model: 'Training model...',
  processing_suggestions: 'Finding suggestions...',
  cancel: 'Canceling...',
  error: 'Error',
};

const IXSuggestions = () => {
  const { suggestions, extractor, templates, aggregation, currentStatus, totalPages } =
    useLoaderData() as {
      totalPages: number;
      suggestions: EntitySuggestionType[];
      extractor: IXExtractorInfo;
      templates: ClientTemplateSchema[];
      aggregation: any;
      currentStatus: ixStatus;
    };

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [sidepanel, setSidepanel] = useState<'filters' | 'pdf' | 'none'>('none');
  const [suggestion, setSuggestion] = useState<EntitySuggestionType>();
  const [selected, setSelected] = useState<Row<EntitySuggestionType>[]>([]);
  const revalidator = useRevalidator();
  const setNotifications = useSetRecoilState(notificationAtom);
  const [status, setStatus] = useState<{
    status: ixStatus;
    message?: string;
    data?: { processed: number; total: number };
  }>({ status: currentStatus });

  useEffect(() => {
    socket.on(
      'ix_model_status',
      (extractorId: string, modelStatus: string, _: string, data: any) => {
        if (extractorId === extractor._id) {
          setStatus({ status: modelStatus as ixStatus, data });
          if ((data && data.total === data.processed) || modelStatus === 'ready') {
            setStatus({ status: 'ready' });
            revalidator.revalidate();
          }
        }
      }
    );

    return () => {
      socket.off('ix_model_status');
    };
  }, []);

  const filteredTemplates = () =>
    templates ? templates.filter(template => extractor.templates.includes(template._id)) : [];

  const acceptSuggestions = async (acceptedSuggestions: EntitySuggestionType[]) => {
    try {
      await suggestionsAPI.accept(
        acceptedSuggestions.map(acceptedSuggestion => ({
          _id: acceptedSuggestion._id as ObjectIdSchema,
          sharedId: acceptedSuggestion.sharedId,
          entityId: acceptedSuggestion.entityId,
        }))
      );
      revalidator.revalidate();
      setNotifications({
        type: 'success',
        text: <Translate>Suggestion accepted.</Translate>,
      });
    } catch (error) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: error.json?.prettyMessage ? error.json.prettyMessage : undefined,
      });
    }
  };

  const trainModelOrCancelAction = async () => {
    try {
      if (status.status === 'ready') {
        setStatus({ status: 'sending_labeled_data' });
        const response = await suggestionsAPI.findSuggestions(extractor._id);
        setStatus(response);
      } else {
        await suggestionsAPI.cancel(extractor._id);
        if (status.status === 'error') {
          setStatus({ status: 'ready' });
        } else {
          setStatus({ status: 'cancel' });
        }
        revalidator.revalidate();
      }
    } catch (error) {}
  };

  const showPageNumbers = () => {
    const page = searchParams.has('page') ? Number(searchParams.get('page')) : 1;
    const from = (page - 1) * SUGGESTIONS_PER_PAGE + 1;
    return (
      <div className="text-sm font-semibold text-center text-gray-900">
        <span className="font-light text-gray-500">
          <Translate>Showing</Translate>
        </span>
        &nbsp;
        {from}-{from + suggestions.length - 1}
        &nbsp;
        <span className="font-light text-gray-500">
          <Translate>of</Translate>
        </span>
        &nbsp;
        {totalPages}
      </div>
    );
  };

  const openPDFSidepanel = (selectedSuggestion: EntitySuggestionType) => {
    setSuggestion(selectedSuggestion);
    setSidepanel('pdf');
  };

  const closeSidepanel = () => {
    setSidepanel('none');
  };

  return (
    <div
      className="tw-content"
      data-testid="settings-ix"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Metadata extraction', '/settings/metadata_extraction']])}
          title={extractor.name}
        />

        <SettingsContent.Body>
          <Table<EntitySuggestionType>
            data={suggestions}
            columns={suggestionsTableColumnsBuilder(
              filteredTemplates(),
              acceptSuggestions,
              openPDFSidepanel
            )}
            title={
              <SuggestionsTitle
                propertyName={extractor.property}
                templates={filteredTemplates()}
                onFiltersButtonClicked={() => {
                  setSidepanel('filters');
                }}
              />
            }
            enableSelection
            onSelection={setSelected}
            footer={
              <div className="flex justify-between h-6">
                <div className="">{showPageNumbers()}</div>
                <div>
                  <Paginator
                    totalPages={totalPages}
                    currentPage={searchParams.has('page') ? Number(searchParams.get('page')) : 1}
                    buildUrl={(page: any) => {
                      const innerSearchParams = new URLSearchParams(location.search);
                      innerSearchParams.delete('page');
                      innerSearchParams.set('page', page);
                      return `${location.pathname}?${innerSearchParams.toString()}`;
                    }}
                  />
                </div>
              </div>
            }
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className={`flex gap-2 ${selected.length ? 'bg-gray-200' : ''}`}>
          {selected.length ? (
            <div className="flex items-center justify-center space-x-4">
              <Button
                size="small"
                type="button"
                styling="outline"
                onClick={async () => {
                  await acceptSuggestions(
                    selected.map(selectedSuggestion => selectedSuggestion.original)
                  );
                }}
              >
                <Translate>Accept suggestion</Translate>
              </Button>
              <div className="text-sm font-semibold text-center text-gray-900">
                <span className="font-light text-gray-500">
                  <Translate>Selected</Translate>
                </span>
                &nbsp;
                {selected.length}
                &nbsp;
                <span className="font-light text-gray-500">
                  <Translate>of</Translate>
                </span>
                &nbsp;
                {SUGGESTIONS_PER_PAGE}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-4">
              <Button
                size="small"
                type="button"
                disabled={status.status === 'cancel'}
                styling={status.status === 'ready' ? 'solid' : 'outline'}
                onClick={trainModelOrCancelAction}
              >
                {status.status === 'ready' ? (
                  <Translate>Find suggestions</Translate>
                ) : (
                  <Translate>Cancel</Translate>
                )}
              </Button>
              {status.status !== 'ready' ? (
                <div className="text-sm font-semibold text-center text-gray-900">
                  <Translate>{ixmessages[status.status]}</Translate>
                  {status.message && status.status === 'error' ? ` : ${status.message}` : ''}
                  {status.data ? (
                    <span className="ml-2">
                      {status.data.processed} / {status.data.total}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>

      <FiltersSidepanel
        showSidepanel={sidepanel === 'filters'}
        setShowSidepanel={closeSidepanel}
        aggregation={aggregation}
      />

      <PDFSidepanel
        showSidepanel={sidepanel === 'pdf'}
        setShowSidepanel={closeSidepanel}
        suggestion={suggestion}
      />
    </div>
  );
};

const IXSuggestionsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId }, request }) => {
    if (!extractorId) throw new Error('extractorId is required');
    const searchParams = new URLSearchParams(request.url.split('?')[1]);
    const filter: any = { extractorId };
    if (searchParams.has('filter')) {
      filter.customFilter = JSON.parse(searchParams.get('filter')!);
    }
    const response = await suggestionsAPI.get(
      {
        filter,
        page: {
          number: searchParams.has('page') ? Number(searchParams.get('page')) : 1,
          size: SUGGESTIONS_PER_PAGE,
        },
      },
      headers
    );
    const extractors = await extractorsAPI.getById(extractorId, headers);
    const aggregation = await suggestionsAPI.aggregation(extractorId, headers);
    const currentStatus = await suggestionsAPI.status(extractorId, headers);
    const templates = await templatesAPI.get(headers);
    return {
      suggestions: response.suggestions,
      totalPages: response.totalPages,
      extractor: extractors[0],
      templates,
      aggregation,
      currentStatus: currentStatus.status,
    };
  };

export { IXSuggestions, IXSuggestionsLoader };
