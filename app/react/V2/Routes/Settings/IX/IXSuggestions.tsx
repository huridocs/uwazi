/* eslint-disable max-statements */
import React, { useEffect, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator, useSearchParams } from 'react-router-dom';
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
  const { suggestions, extractor, templates, aggregation, currentStatus } = useLoaderData() as {
    suggestions: EntitySuggestionType[];
    extractor: IXExtractorInfo;
    templates: ClientTemplateSchema[];
    aggregation: any;
    currentStatus: ixStatus;
  };
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
        console.log('Status changed to: ', modelStatus);
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

  const acceptSuggestions = async (suggestions: EntitySuggestionType[]) => {
    try {
      await suggestionsAPI.accept(
        suggestions.map(suggestion => ({
          _id: suggestion._id as ObjectIdSchema,
          sharedId: suggestion.sharedId,
          entityId: suggestion.entityId,
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
              <div className="flex h-4">
                <div className="flex-none">
                  <div className="text-sm font-semibold text-center text-gray-900">
                    <span className="font-light text-gray-500">Showing</span> 1-
                    {searchParams.get('size') + ' '}
                    <span className="font-light text-gray-500">of</span> 200
                  </div>
                </div>
                <div className="self-end flex-1">
                  <Paginator
                    totalPages="200"
                    currentPage="1"
                    buildUrl={(page: any) => 'http://localhost:3000'}
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
                onClick={() => {
                  acceptSuggestions(selected.map(suggestion => suggestion.original));
                }}
              >
                <Translate>Accept suggestion</Translate>
              </Button>
              <div className="text-sm font-semibold text-center text-gray-900">
                <span className="font-light text-gray-500">Selected</span> {selected.length}{' '}
                <span className="font-light text-gray-500">of</span> 20
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
  async ({ params: { extractorId } }) => {
    console.log('loader');
    if (!extractorId) throw new Error('extractorId is required');
    console.log('loader 1');
    const response = await suggestionsAPI.get(
      {
        filter: { extractorId: extractorId! },
        page: {
          number: 1,
          size: 20,
        },
      },
      headers
    );
    console.log('loader 2');
    const extractors = await extractorsAPI.getById(extractorId, headers);
    const aggregation = await suggestionsAPI.aggregation(
      {
        filter: { extractorId: extractorId! },
      },
      headers
    );
    console.log('loader 3');
    const currentStatus = await suggestionsAPI.status(extractorId, headers);
    const templates = await templatesAPI.get(headers);
    console.log('loader');
    return {
      suggestions: response.suggestions,
      extractor: extractors[0],
      templates,
      aggregation,
      currentStatus: currentStatus.status,
    };
  };

export { IXSuggestions, IXSuggestionsLoader };
