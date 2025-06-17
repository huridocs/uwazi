/* eslint-disable max-lines */
/* eslint-disable max-statements */
import React, { useEffect, useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import {
  LoaderFunction,
  useLoaderData,
  useLocation,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from 'react-router';
import { SortingState } from '@tanstack/react-table';
import { useSetAtom } from 'jotai';
import * as extractorsAPI from 'app/V2/api/ix/extractors';
import * as suggestionsAPI from 'app/V2/api/ix/suggestions';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, PaginationState, Paginator, Table } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { ClientEntitySchema, ClientPropertySchema } from 'app/istore';
import { notificationAtom } from 'app/V2/atoms';
import { SuggestionsTitle } from './components/SuggestionsTitle';
import { FiltersSidepanel } from './components/FiltersSidepanel';
import { suggestionsTableColumnsBuilder } from './components/TableElements';
import { SuggestionSidepanel } from './components/SuggestionSidepanel';
import {
  updateSuggestionsByEntity,
  generateChildrenRows,
  updateSuggestions,
  formatAccepted,
  updateSortingUrl,
} from './helpers';
import {
  TableSuggestion,
  MultiValueSuggestion,
  SingleValueSuggestion,
  ixStatus,
  IXSuggestionsLoaderResponse,
  EntitySuggestion,
} from './types';
import { useEventHandler } from './hooks/useEventHandler';

const SUGGESTIONS_PER_PAGE = 100;

const ixmessages = {
  ready: 'Find suggestions',
  sending_labeled_data: 'Sending labeled data...',
  processing_model: 'Training model...',
  processing_suggestions: 'Finding suggestions...',
  cancel: 'Canceling...',
  error: 'Error',
};

const IXSuggestions = () => {
  const {
    suggestions,
    extractor,
    templates,
    aggregation,
    currentStatus,
    totalPages,
    activeFilters,
  } = useLoaderData() as IXSuggestionsLoaderResponse;
  const [currentSuggestions, setCurrentSuggestions] = useState<TableSuggestion[]>(suggestions);
  const [property, setProperty] = useState<ClientPropertySchema>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidepanel, setSidepanel] = useState<'filters' | 'pdf' | 'property' | 'none'>('none');
  const [sidepanelSuggestion, setSidepanelSuggestion] = useState<TableSuggestion>();
  const [selected, setSelected] = useState<TableSuggestion[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [aggregations, setAggregations] = useState<any>(aggregation);
  const { revalidate } = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
  const [status, setStatus] = useState<{
    status: ixStatus;
    message?: string;
    data?: { processed: number; total: number };
  }>({ status: currentStatus });

  const fetchAgregations = async () => {
    const newAggregations = await suggestionsAPI.aggregation(extractor._id!);
    setAggregations(newAggregations);
  };

  const filteredTemplates = () =>
    templates ? templates.filter(template => extractor.templates.includes(template._id)) : [];

  const onEntitySave = async (updatedEntity: ClientEntitySchema) => {
    setCurrentSuggestions(updateSuggestionsByEntity(currentSuggestions, updatedEntity, property));
    await fetchAgregations();
  };

  const acceptSuggestions = async (acceptedSuggestions: TableSuggestion[]) => {
    const preparedSuggestions = formatAccepted(acceptedSuggestions);

    try {
      await suggestionsAPI.accept(preparedSuggestions);
      setCurrentSuggestions(prevSuggestions =>
        updateSuggestions(prevSuggestions, acceptedSuggestions)
      );
      setSelected([]);
      setNotifications({
        type: 'info',
        text: <Translate>Suggestions sent</Translate>,
      });
    } catch (error) {
      setCurrentSuggestions(suggestions);
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: error.json?.prettyMessage ? error.json.prettyMessage : undefined,
      });
    }
  };

  const trainModelOrCancelAction = async () => {
    try {
      if (status.status === ixStatus.ready) {
        setStatus({ status: ixStatus.sending_labeled_data });
        const response = await suggestionsAPI.findSuggestions(extractor._id!);
        setStatus(response);
      } else {
        await suggestionsAPI.cancel(extractor._id!);
        if (status.status === ixStatus.error) {
          setStatus({ status: ixStatus.ready });
        } else {
          setStatus({ status: ixStatus.cancel });
        }
        await revalidate();
      }
    } catch (error) {}
  };

  const openSidepanel = (selectedSuggestion: TableSuggestion) => {
    setSidepanelSuggestion(selectedSuggestion);
    const type = selectedSuggestion.extractorSource.pdf ? 'pdf' : 'property';
    setSidepanel(type);
  };

  const closeSidepanel = () => {
    setSidepanelSuggestion(undefined);
    setSidepanel('none');
  };

  useMemo(() => {
    if (property?.type === 'multiselect' || property?.type === 'relationship') {
      const flatenedSuggestions = suggestions.map(suggestion =>
        generateChildrenRows(suggestion as MultiValueSuggestion)
      );
      setCurrentSuggestions(flatenedSuggestions);
      return;
    }

    setCurrentSuggestions(
      suggestions.map(suggestion => ({ ...suggestion, isChild: false }) as SingleValueSuggestion)
    );
  }, [suggestions, property]);

  useEffect(() => {
    setAggregations(aggregation);
  }, [aggregation]);

  useEffect(() => {
    const navigatePromise = async (path: string) => navigate(path, { replace: true });
    const newUrl = updateSortingUrl(sorting, location.pathname, searchParams);
    navigatePromise(newUrl).catch(_e => {});
  }, [sorting]);

  useEffect(() => {
    const template = templates.find(t => t._id === extractor.templates[0]);
    const _property =
      extractor.property === 'title'
        ? template?.commonProperties?.find(prop => prop.name === extractor.property)
        : template?.properties?.find(prop => prop.name === extractor.property);
    setProperty(_property);
  }, [templates, extractor]);

  useEventHandler({
    extractorId: extractor._id!,
    updateStatus: (newStatus, data) => setStatus({ status: newStatus, data }),
    fetchAggregations: fetchAgregations,
  });

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
          <Table
            data={currentSuggestions}
            enableSelections
            columns={suggestionsTableColumnsBuilder(
              filteredTemplates(),
              acceptSuggestions,
              openSidepanel
            )}
            sortingFn={sortingState => {
              setSorting(sortingState);
            }}
            onChange={({ selectedRows }) => {
              setSelected(() =>
                currentSuggestions.filter(current => current.rowId in selectedRows)
              );
            }}
            header={
              <SuggestionsTitle
                property={extractor.property}
                templates={filteredTemplates()}
                onFiltersButtonClicked={() => {
                  setSidepanel('filters');
                }}
                activeFilters={activeFilters}
              />
            }
            footer={
              <div className="flex justify-between h-6">
                <PaginationState
                  page={Number(searchParams.get('page') || 1)}
                  size={SUGGESTIONS_PER_PAGE}
                  total={aggregations.total || totalPages * SUGGESTIONS_PER_PAGE}
                  currentLength={currentSuggestions.length}
                />
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
                  await acceptSuggestions(selected);
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
                disabled={status.status === ixStatus.cancel}
                styling={status.status === ixStatus.ready ? 'solid' : 'outline'}
                onClick={trainModelOrCancelAction}
              >
                {status.status === ixStatus.ready ? (
                  <Translate>Find suggestions</Translate>
                ) : (
                  <Translate>Cancel</Translate>
                )}
              </Button>
              {status.status !== ixStatus.ready ? (
                <div className="text-sm font-semibold text-center text-gray-900">
                  <Translate>{ixmessages[status.status]}</Translate>
                  {status.message && status.status === ixStatus.error ? ` : ${status.message}` : ''}
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
        aggregation={aggregations}
      />

      <SuggestionSidepanel
        showSidepanel={sidepanel === 'pdf' || sidepanel === 'property'}
        property={property}
        setShowSidepanel={closeSidepanel}
        suggestion={sidepanelSuggestion}
        onEntitySave={onEntitySave}
      />
    </div>
  );
};

const IXSuggestionsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId }, request }): Promise<IXSuggestionsLoaderResponse> => {
    if (!extractorId) throw new Error('extractorId is required');
    const searchParams = new URLSearchParams(request.url.split('?')[1]);
    const filter: any = { extractorId };
    let activeFilters = 0;
    if (searchParams.has('filter')) {
      filter.customFilter = JSON.parse(searchParams.get('filter')!);
      activeFilters = Object.values(filter.customFilter).filter(Boolean).length;
    }
    const sortingOption = searchParams.has('sort') ? searchParams.get('sort') : undefined;

    const suggestionsList: {
      suggestions: EntitySuggestion[];
      totalPages: number;
    } = await suggestionsAPI.get(
      {
        filter,
        page: {
          number: searchParams.has('page') ? Number(searchParams.get('page')) : 1,
          size: SUGGESTIONS_PER_PAGE,
        },
        ...(sortingOption && { sort: JSON.parse(sortingOption) }),
      },
      headers
    );

    const extractors = await extractorsAPI.getById(extractorId, headers);
    const aggregation = await suggestionsAPI.aggregation(extractorId, headers);
    const currentStatus = await suggestionsAPI.status(extractorId, headers);
    const templates = await templatesAPI.get(headers);

    const suggestions = suggestionsList.suggestions.map(suggestion => ({
      ...suggestion,
      rowId: suggestion._id,
      disableRowSelection:
        suggestion.state.obsolete || suggestion.state.processing || suggestion.state.error,
      extractorSource: extractors[0].source,
    }));

    return {
      suggestions,
      totalPages: suggestionsList.totalPages,
      extractor: extractors[0],
      templates,
      aggregation,
      currentStatus: currentStatus.status,
      activeFilters,
    };
  };

export { IXSuggestions, IXSuggestionsLoader };
