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
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Row } from '@tanstack/react-table';
import * as extractorsAPI from 'app/V2/api/ix/extractors';
import * as suggestionsAPI from 'app/V2/api/ix/suggestions';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { suggestionsTableColumnsBuilder } from './components/TableElements';
import { Button, Paginator, Table } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { IXExtractorInfo } from 'app/V2/shared/types';
import { SuggestionsTitle } from './components/SuggestionsTitle';
import { ClientTemplateSchema } from 'app/istore';
import { useSetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { FiltersSidepanel } from './components/FiltersSidepanel';
import { socket } from 'app/socket';

const SUGGESTIONS_PER_PAGE = 1;

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
  processing_suggestions: 'Finding suggestions',
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
  const [showSidepanel, setShowSidepanel] = useState(false);
  const [selected, setSelected] = useState<Row<EntitySuggestionType>[]>([]);
  const revalidator = useRevalidator();
  const setNotifications = useSetRecoilState(notificationAtom);
  const [status, setStatus] = useState<ixStatus>(currentStatus);

  useEffect(() => {
    socket.on(
      'ix_model_status',
      (extractorId: string, modelStatus: string, _: string, data: any) => {
        if (extractorId === extractor._id) {
          setStatus(modelStatus as ixStatus);
          if ((data && data.total === data.processed) || modelStatus === 'ready') {
            setStatus('ready');
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

  const trainModelAction = async () => {
    try {
      setStatus('sending_labeled_data');
      const response = await suggestionsAPI.findSuggestions(extractor._id);
      setStatus(response.status);
    } catch (error) {}
  };

  return (
    <div
      className="tw-content"
      data-testid="settings-ix"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header
          title={
            <>
              <Translate>Metadata extraction</Translate> <ChevronRightIcon className="w-4 mx-2" />{' '}
              {extractor.name}
            </>
          }
        />

        <SettingsContent.Body>
          <Table<EntitySuggestionType>
            data={suggestions}
            columns={suggestionsTableColumnsBuilder(filteredTemplates(), acceptSuggestions)}
            title={
              <SuggestionsTitle
                propertyName={extractor.property}
                templates={filteredTemplates()}
                onFiltersButtonClicked={() => {
                  setShowSidepanel(true);
                }}
              />
            }
            enableSelection
            onSelection={setSelected}
            footer={
              <div className="flex justify-between h-6">
                <div className="">
                  <div className="text-sm font-semibold text-center text-gray-900">
                    <span className="font-light text-gray-500">
                      <Translate>Showing</Translate>
                    </span>{' '}
                    1-
                    {SUGGESTIONS_PER_PAGE}
                    <span className="font-light text-gray-500">
                      <Translate>of</Translate>
                    </span>{' '}
                    {totalPages}
                  </div>
                </div>
                <div>
                  <Paginator
                    totalPages={totalPages}
                    currentPage={searchParams.has('page') ? Number(searchParams.get('page')) : 1}
                    buildUrl={(page: any) => {
                      const innerSearchParams = new URLSearchParams(location.search);
                      innerSearchParams.delete('page');
                      innerSearchParams.set('page', page);
                      return location.pathname + '?' + innerSearchParams.toString();
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
                  await acceptSuggestions(selected.map(suggestion => suggestion.original));
                }}
              >
                <Translate>Accept suggestion</Translate>
              </Button>
              <div className="text-sm font-semibold text-center text-gray-900">
                <span className="font-light text-gray-500">
                  <Translate>Selected</Translate>
                </span>{' '}
                {selected.length}{' '}
                <span className="font-light text-gray-500">
                  <Translate>of</Translate>
                </span>{' '}
                {SUGGESTIONS_PER_PAGE}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-4">
              <Button
                size="small"
                type="button"
                disabled={status !== 'ready'}
                onClick={trainModelAction}
              >
                <Translate>Find suggestions</Translate>
              </Button>
              <div className="text-sm font-semibold text-center text-gray-900">
                <Translate>{ixmessages[status]}</Translate>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <FiltersSidepanel
        showSidepanel={showSidepanel}
        setShowSidepanel={setShowSidepanel}
        aggregation={aggregation}
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
