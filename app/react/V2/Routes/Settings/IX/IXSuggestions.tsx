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
} from 'react-router';
import { SortingState } from '@tanstack/react-table';
import { useSetAtom } from 'jotai';
import { isEmpty } from 'lodash';
import { FunnelIcon } from '@heroicons/react/24/solid';
import * as extractorsAPI from 'V2/api/ix/extractors';
import * as suggestionsAPI from 'V2/api/ix/suggestions';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button, PaginationState, Paginator, Table } from 'V2/Components/UI';
import { notificationAtom } from 'V2/atoms';
import { Translate } from 'app/I18N';
import { ClientPropertySchema } from 'app/istore';
import { handleUnexpectedError } from 'V2/shared/errorUtils';
import { SuggestionsTitle } from './components/SuggestionsTitle';
import { FiltersSidepanel } from './components/FiltersSidepanel';
import { suggestionsTableColumnsBuilder } from './components/TableElements';
import { generateChildrenRows, formatAccepted } from './helpers';
import {
  TableSuggestion,
  MultiValueSuggestion,
  SingleValueSuggestion,
  ixStatus,
  IXSuggestionsLoaderResponse,
  EntitySuggestion,
} from './types';
import { useEventHandler } from './hooks/useEventHandler';
import { acceptedSuggestions } from './components/atoms';
import { PDFSidepanel } from './components/PDFSidepanel';
import { PropertySidepanel } from './components/PropertySidepanel';
import { TrainModelModal } from './components/TrainModelModal';
import { ProcessExtractorModal } from './components/ProcessExtractorModal';
import {
  getPropertyValuesMap,
  getRelationshipInfo,
  updateSuggestionValues,
} from './helpers/loaderHelper';

const SUGGESTIONS_PER_PAGE = 100;

const ixmessages = {
  ready: 'Find suggestions',
  sending_labeled_data: 'Sending labeled data...',
  processing_model: 'Training model...',
  processing_suggestions: 'Finding suggestions...',
  processing_auto_accept: 'Accepting suggestions...',
  cancel: 'Canceling...',
  error: 'Error',
};

const getDefaultSorting = (searchParams: URLSearchParams): SortingState => {
  if (searchParams?.get('sort')) {
    const { property: sortingProperty, order } = JSON.parse(searchParams.get('sort') || '') as {
      property: string;
      order: string;
    };
    return [{ id: sortingProperty, desc: order === 'desc' && true }];
  }
  return [];
};

const IXSuggestions = () => {
  const {
    suggestions,
    extractor,
    templates,
    aggregation,
    currentStatus,
    totalPages,
    total,
    activeFilters,
  } = useLoaderData() as IXSuggestionsLoaderResponse;
  const [currentSuggestions, setCurrentSuggestions] = useState<TableSuggestion[]>(suggestions);
  const [property, setProperty] = useState<ClientPropertySchema>();
  const [sidepanel, setSidepanel] = useState<'filters' | 'pdf' | 'property' | 'none'>('none');
  const [modal, setModal] = useState<'train' | 'process' | 'none' | 'processSelected'>('none');
  const [status, setStatus] = useState<{
    status: ixStatus;
    message?: string;
    data?: { processed: number; total: number };
  }>({ status: currentStatus });
  const [selected, setSelected] = useState<TableSuggestion[]>([]);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidepanelSuggestion, setSidepanelSuggestion] = useState<TableSuggestion>();
  const { revalidate } = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
  const setAcceptedSuggestionsAtom = useSetAtom(acceptedSuggestions);

  const filteredTemplates = () =>
    templates ? templates.filter(template => extractor.templates.includes(template._id)) : [];

  const onEntitySave = async () => {
    await revalidate();
  };

  const acceptSuggestions = async (suggestionsToAccept: TableSuggestion[]) => {
    const preparedSuggestions = formatAccepted(suggestionsToAccept);

    try {
      await suggestionsAPI.accept(preparedSuggestions);
      const newAcceptedIds = suggestionsToAccept.map(s => s._id);
      setAcceptedSuggestionsAtom(prev => {
        const newSet = new Set(prev || []);
        newAcceptedIds.forEach(id => newSet.add(id));
        return newSet;
      });

      setSelected([]);
      setNotifications({
        type: 'info',
        text: <Translate>Suggestions sent</Translate>,
      });
    } catch (error) {
      handleUnexpectedError(error, 'Error accepting suggestions');
    }
  };

  const trainModel = async (
    findAmount: number,
    samplePolicy: 'only_marked' | 'marked_plus_labeled'
  ) => {
    if (status.status === ixStatus.ready) {
      if (extractor._id) {
        try {
          await suggestionsAPI.findSuggestions({
            extractorId: extractor._id,
            suggestionsToFind: findAmount,
            samplePolicy,
          });
          setStatus({ status: ixStatus.sending_labeled_data });
        } catch (error) {
          handleUnexpectedError(error, 'Error training model');
        }
      }
    }
  };

  const cancelModelTrain = async () => {
    if (status.status !== ixStatus.ready) {
      try {
        await suggestionsAPI.cancel(extractor._id!);
        if (status.status === ixStatus.error) {
          setStatus({ status: ixStatus.ready });
        } else {
          setStatus({ status: ixStatus.cancel });
        }
        await revalidate();
        setAcceptedSuggestionsAtom(new Set());
      } catch (error) {
        handleUnexpectedError(error, 'Error canceling model train');
      }
    }
  };

  const processExtractor = async (data: Omit<suggestionsAPI.ProcessParameters, 'extractorId'>) => {
    if (extractor._id) {
      try {
        const params = { ...data, extractorId: extractor._id };

        const response = await suggestionsAPI.process(params);

        const autoAccepting = data.autoAccept?.enabled;

        const initialTotal =
          data.mode === 'process_extractor'
            ? Number(response?.data?.total)
            : Number(data.find?.selectedSharedIds?.length);

        if (response.status === ixStatus.processing_suggestions) {
          setStatus({
            status: ixStatus.processing_suggestions,
            message: ixmessages[ixStatus.processing_suggestions],
            data: { processed: 0, total: initialTotal },
          });
          return;
        }

        if (autoAccepting) {
          setStatus({
            status: ixStatus.processing_auto_accept,
            message: ixmessages[ixStatus.processing_auto_accept],
          });
          return;
        }

        if (response.status === ixStatus.ready) {
          setStatus({ status: ixStatus.ready });
        }
      } catch (error) {
        handleUnexpectedError(error, 'Error processing extractor');
      }
    }
  };

  const markForTraining = async (suggestionIds: string[], use: boolean) => {
    if (extractor._id) {
      try {
        await suggestionsAPI.setForTraining({
          extractorId: extractor._id,
          suggestionIds,
          useForTraining: use,
        });
        await revalidate();
      } catch (e) {
        handleUnexpectedError(e, 'An error has ocurred');
      }
    }
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

  const handleSorting = (sortingState: SortingState) => {
    if (sortingState.length === 0) {
      if (searchParams.has('sort')) {
        setSearchParams(prev => {
          const newSearchParams = new URLSearchParams(prev);
          newSearchParams.delete('sort');
          return newSearchParams;
        });
      }
    } else {
      const sortingObject = sortingState[0];
      const sortingParams = {
        property: sortingObject.id || '',
        order: sortingObject.desc ? 'desc' : 'asc',
      };

      setSearchParams(prev => {
        const newSearchParams = new URLSearchParams(prev);
        newSearchParams.set('sort', JSON.stringify(sortingParams));
        return newSearchParams;
      });
    }
  };

  useEffect(() => {
    const template = templates.find(t => t._id === extractor.templates[0]);
    const _property =
      extractor.property === 'title'
        ? template?.commonProperties?.find(prop => prop.name === extractor.property)
        : template?.properties?.find(prop => prop.name === extractor.property);
    setProperty(_property);
  }, [templates, extractor]);

  useEffect(() => {
    if (property?.type === 'multiselect' || property?.type === 'relationship') {
      setCurrentSuggestions(() =>
        suggestions.map(suggestion => generateChildrenRows(suggestion as MultiValueSuggestion))
      );
    } else {
      setCurrentSuggestions(
        suggestions.map(suggestion => ({ ...suggestion, isChild: false }) as SingleValueSuggestion)
      );
    }
  }, [suggestions, property, extractor]);

  useEffect(() => () => setAcceptedSuggestionsAtom(new Set()), [setAcceptedSuggestionsAtom]);

  useEventHandler({
    extractorId: extractor._id!,
    updateStatus: (newStatus, data) => setStatus({ status: newStatus, data }),
  });

  return (
    <div className="h-full w-full overflow-y-auto" data-testid="settings-ix">
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Metadata extraction', '/settings/metadata_extraction']])}
          title={extractor.name}
        />
        <SettingsContent.Body>
          <Table
            data={currentSuggestions}
            enableSelections
            columns={suggestionsTableColumnsBuilder({
              templates: filteredTemplates(),
              acceptSuggestions,
              openPdfSidepanel: openSidepanel,
              markForTraining,
            })}
            onSelect={({ selectedRows }) => {
              setSelected(() =>
                currentSuggestions.filter(current => current.rowId in selectedRows)
              );
            }}
            onSort={({ sortingState }) => {
              handleSorting(sortingState);
            }}
            manualSorting
            defaultSorting={getDefaultSorting(searchParams)}
            header={
              <SuggestionsTitle property={extractor.property} templates={filteredTemplates()} />
            }
            actions={
              <Button size="small" styling="light" onClick={() => setSidepanel('filters')}>
                <FunnelIcon
                  className={`inline w-4 mr-2 ${activeFilters > 0 ? 'text-primary-900' : 'text-gray-800'} `}
                />
                <Translate>Stats & Filters</Translate>
                {activeFilters > 0 && (
                  <span className="px-3 py-[2px] ml-2 text-xs text-white rounded-md bg-primary-900">
                    {activeFilters}
                  </span>
                )}
              </Button>
            }
            footer={
              <div className="flex justify-between h-6">
                <PaginationState
                  page={Number(searchParams.get('page') || 1)}
                  size={SUGGESTIONS_PER_PAGE}
                  total={total}
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

        <SettingsContent.Footer className="flex gap-2" highlighted={selected.length > 0}>
          <div className="flex items-center justify-center space-x-4">
            {status.status === ixStatus.ready ? (
              <Button
                size="small"
                type="button"
                styling="solid"
                onClick={() => setModal('train')}
                disabled={selected.length > 0}
              >
                <Translate>Train model</Translate>
              </Button>
            ) : (
              <Button size="small" type="button" styling="outline" onClick={cancelModelTrain}>
                <Translate>Cancel</Translate>
              </Button>
            )}
            <Button
              size="small"
              type="button"
              styling="solid"
              onClick={() => setModal('process')}
              disabled={status.status !== ixStatus.ready}
            >
              {selected.length > 0 ? (
                <Translate>Process selected</Translate>
              ) : (
                <Translate>Process extractor</Translate>
              )}
            </Button>
            {status.status !== ixStatus.ready && (
              <div className="text-sm font-semibold text-center text-gray-900">
                <Translate>{ixmessages[status.status]}</Translate>
                {status.message && status.status === ixStatus.error ? ` : ${status.message}` : ''}
                {status.data && (
                  <span className="ml-2">
                    {status.data.processed} / {status.data.total}
                  </span>
                )}
              </div>
            )}
            {selected.length > 0 && (
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
            )}
          </div>
        </SettingsContent.Footer>
      </SettingsContent>

      <FiltersSidepanel
        showSidepanel={sidepanel === 'filters'}
        setShowSidepanel={closeSidepanel}
        aggregation={aggregation}
      />

      <PropertySidepanel
        showSidepanel={sidepanel === 'property'}
        property={property}
        setShowSidepanel={closeSidepanel}
        suggestion={sidepanelSuggestion}
        onEntitySave={onEntitySave}
        extractor={extractor}
      />

      <PDFSidepanel
        showSidepanel={sidepanel === 'pdf'}
        property={property}
        setShowSidepanel={closeSidepanel}
        suggestion={sidepanelSuggestion}
        onEntitySave={onEntitySave}
        extractor={extractor}
      />

      {modal === 'train' && (
        <TrainModelModal
          close={() => {
            setModal('none');
          }}
          onTrain={trainModel}
        />
      )}

      {modal === 'process' && (
        <ProcessExtractorModal
          close={() => {
            setModal('none');
          }}
          onTrain={processExtractor}
          selected={selected.map(s => s.sharedId)}
        />
      )}
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
      total: number;
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

    const template = templates.find(t => extractors[0].templates.includes(t._id));
    const property =
      extractors[0].property === 'title'
        ? template?.commonProperties?.find(prop => prop.name === extractors[0].property)
        : template?.properties?.find(prop => prop.name === extractors[0].property);

    let suggestions = suggestionsList.suggestions.map(suggestion => ({
      ...suggestion,
      rowId: suggestion._id,
      disableRowSelection: suggestion.state.processing,
      extractorSource: extractors[0].source,
    }));

    if (property?.type === 'relationship') {
      const { allCurrentValueIds, targetProperty, allSuggestedValueIds } = getRelationshipInfo(
        suggestions,
        property,
        templates
      );
      extractors[0].inheritedProperty = targetProperty;
      const entityCurrentValuesMap = !isEmpty(allCurrentValueIds)
        ? await getPropertyValuesMap(allCurrentValueIds, property, targetProperty, headers)
        : new Map();
      const entitySuggestedValuesMap = !isEmpty(allSuggestedValueIds)
        ? await getPropertyValuesMap(allSuggestedValueIds, property, targetProperty, headers)
        : new Map();

      suggestions = updateSuggestionValues(
        suggestions,
        entityCurrentValuesMap,
        entitySuggestedValuesMap
      );
    }

    return {
      suggestions,
      totalPages: suggestionsList.totalPages,
      extractor: extractors[0],
      templates,
      aggregation,
      currentStatus: currentStatus.status,
      activeFilters,
      total: suggestionsList.total,
    };
  };

export { IXSuggestions, IXSuggestionsLoader };
