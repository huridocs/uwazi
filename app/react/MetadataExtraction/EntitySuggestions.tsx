/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Icon } from 'UI';
import { HeaderGroup, Row } from 'react-table';
import { connect } from 'react-redux';
import { I18NLink, Translate } from 'app/I18N';
import { socket } from 'app/socket';
import { store } from 'app/store';
import { ClientEntitySchema } from 'app/istore';
import { Pagination } from 'app/UI/BasicTable/Pagination';
import { RequestParams } from 'app/utils/RequestParams';
import { SuggestionAcceptanceModal } from 'app/MetadataExtraction/SuggestionAcceptanceModal';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { suggestionsTable } from 'app/MetadataExtraction/SuggestionsTable';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { PropertySchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { TemplateSchema } from 'shared/types/templateType';
import { SuggestionsStats } from 'shared/types/suggestionStats';
import { IXExtractorInfo } from 'V2/Routes/Settings/IX/types';
import {
  getStats,
  getSuggestions,
  ixStatus,
  trainModel,
  cancelFindingSuggestions,
} from './SuggestionsAPI';
import { PDFSidePanel } from './PDFSidePanel';
import { TrainingHealthDashboard } from './TrainingHealthDashboard';
import { CancelFindingSuggestionModal } from './CancelFindingSuggestionsModal';
import { FiltersSidePanel } from './FilterSidePanel';

interface EntitySuggestionsProps {
  property: PropertySchema;
  acceptIXSuggestion: (suggestion: EntitySuggestionType, allLanguages: boolean) => void;
  templates: IImmutable<TemplateSchema[]>;
  languages: any[] | undefined;
  extractor: IXExtractorInfo;
}

interface AggregategationsType {
  state: { _id: string; count: number }[];
  template: { _id: string; count: number }[];
}

function mapStateToProps({ templates }: any) {
  return {
    templates,
  };
}

const getTemplateMap = (templates: IImmutable<TemplateSchema[]>) => {
  const templateNamesById = objectIndex<TemplateSchema, string>(
    templates.toJS(),
    t => t._id?.toString() || '',
    t => t.name
  );
  return templateNamesById;
};

// eslint-disable-next-line max-statements
const EntitySuggestionsComponent = ({
  property: reviewedProperty,
  acceptIXSuggestion,
  templates,
  languages,
  extractor,
}: EntitySuggestionsProps) => {
  const isMounted = useRef(false);
  const [suggestions, setSuggestions] = useState<EntitySuggestionType[]>([]);
  const [aggregations, setAggregations] = useState<AggregategationsType>({
    state: [],
    template: [],
  });
  const [totalPages, setTotalPages] = useState(0);
  const [resetActivePage, setResetActivePage] = useState(false);
  const [status, setStatus] = useState<{ key: string; data?: undefined; message?: string }>({
    key: 'ready',
  });
  const [acceptingSuggestion, setAcceptingSuggestion] = useState(false);
  const [openCancelFindingSuggestions, setOpenCancelFindingSuggestions] = useState(false);
  const [sidePanelOpened, setSidePanelOpened] = useState(false);
  const [stats, setStats] = useState<SuggestionsStats | undefined>(undefined);

  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  const templateNamesById = useMemo(() => getTemplateMap(templates), [templates]);
  const [templateSelection, setTemplateSelection] = useState<string[]>([]);
  const [sueggestionStateSelection, setSuggestionStateSelection] = useState<string[]>([]);

  const showConfirmationModal = (row: Row<EntitySuggestionType>) => {
    row.toggleRowSelected();
    setAcceptingSuggestion(true);
  };

  const actionsCellButtonClassNames = (state: string) => {
    let className = 'btn';
    if (state === SuggestionState.labelMatch) {
      className += 'btn-outline-success label-match';
    }
    if (state === SuggestionState.labelMismatch || state === SuggestionState.valueMismatch) {
      className += 'btn-outline-warning label-value-mismatch';
    }

    if (state === SuggestionState.valueMatch) {
      className += 'btn-outline-primary value-match';
    }
    if (
      state === SuggestionState.labelEmpty ||
      state === SuggestionState.valueEmpty ||
      state === SuggestionState.obsolete ||
      state === SuggestionState.empty ||
      state === SuggestionState.error
    ) {
      className += 'btn-outline-secondary disabled';
    }

    return className;
  };

  const isRequiredFieldWithoutSuggestion = (row: EntitySuggestionType) =>
    (row.propertyName === 'title' && row.suggestedValue === '') ||
    (reviewedProperty.required && row.suggestedValue === '');

  const actionsCell = ({ row }: { row: Row<EntitySuggestionType> }) => {
    const suggestion = row.values;
    const { state } = suggestion;
    return (
      <div>
        <button
          type="button"
          aria-label="Accept suggestion"
          className={actionsCellButtonClassNames(state)}
          disabled={
            state === SuggestionState.labelEmpty ||
            state === SuggestionState.valueEmpty ||
            state === SuggestionState.obsolete ||
            state === SuggestionState.labelMatch ||
            state === SuggestionState.error ||
            isRequiredFieldWithoutSuggestion(row.original)
          }
          onClick={async () => showConfirmationModal(row)}
        >
          <Icon icon="arrow-right" />
        </button>
      </div>
    );
  };

  const showPDF = (row: Row<EntitySuggestionType>) => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    toggleAllRowsSelected(false);
    row.toggleRowSelected();
    setSidePanelOpened(true);
  };

  const closePDFSidePanel = () => {
    setSidePanelOpened(false);
  };

  const segmentCell = ({ row }: { row: Row<EntitySuggestionType> }) => (
    <div onClick={() => showPDF(row)}>
      <span className="segment-pdf">
        <Translate>Open PDF</Translate>
      </span>
      <span className="segment-context">{row.original.segment}</span>
    </div>
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    gotoPage,
    setPageSize,
    selectedFlatRows,
    toggleAllRowsSelected,
    state: { pageIndex, pageSize, filters },
  } = suggestionsTable(reviewedProperty, suggestions, totalPages, actionsCell, segmentCell);

  const retrieveSuggestions = (
    pageNumber: number = pageIndex + 1,
    _stateSelection: string[] = [],
    _templateSelection: string[] = []
  ) => {
    const filter: {
      extractorId?: string;
      states?: string[];
      entityTemplates?: string[];
    } = { extractorId: extractor._id };
    if (_stateSelection.length > 0) filter.states = _stateSelection;
    if (_templateSelection.length > 0) filter.entityTemplates = _templateSelection;
    const params = new RequestParams({
      page: { number: pageNumber, size: pageSize },
      filter,
    });
    getSuggestions(params)
      .then((response: any) => {
        setSuggestions(response.suggestions);
        setAggregations(response.aggregations);
        setTotalPages(response.totalPages);
      })
      .catch(() => {});
  };

  const retriveStats = () => {
    const params = new RequestParams({
      extractorId: extractor._id,
    });
    getStats(params)
      .then((response: any) => {
        setStats(response);
      })
      .catch(() => {});
  };

  const acceptSuggestion = async (allLanguages: boolean) => {
    if (selectedFlatRows.length > 0) {
      const acceptedSuggestion = selectedFlatRows[0].original;
      await acceptIXSuggestion(acceptedSuggestion, allLanguages);
      await retrieveSuggestions();
    }

    setAcceptingSuggestion(false);
    toggleAllRowsSelected(false);
    retriveStats();
  };

  const errorIsNoLabeledData = () => status.key === 'error' && status.message === 'No labeled data';

  const updateError = (changedPropertyValue: string) => {
    if (errorIsNoLabeledData() && changedPropertyValue && changedPropertyValue.length > 0) {
      setStatus({ key: 'ready' });
    }
  };

  const handlePDFSidePanelSave = async (entity: ClientEntitySchema) => {
    setSidePanelOpened(false);
    const propertyName = reviewedProperty.name;
    const changedPropertyValue = (entity[propertyName] ||
      entity.metadata?.[propertyName]) as string;
    await retrieveSuggestions();

    selectedFlatRows[0].setState({});
    updateError(changedPropertyValue);
    retriveStats();
  };

  const _trainModel = async () => {
    setStatus({ key: 'sending_labeled_data' });
    const params = new RequestParams({
      extractorId: extractor._id,
    });

    const response = await trainModel(params);
    const type = response.status === 'error' ? 'danger' : 'success';
    setStatus({ key: response.status, data: response.data, message: response.message });
    store?.dispatch(notify(response.message, type));
    if (status.key === 'ready') {
      await retrieveSuggestions();
    }
  };

  const _cancelFindingSuggestions = async () => {
    setOpenCancelFindingSuggestions(false);
    const params = new RequestParams({
      extractorId: extractor._id,
    });

    if (status.key !== 'ready') {
      setStatus({ key: 'cancel' });
      await cancelFindingSuggestions(params);
    }
  };

  const onFindSuggestionButtonClicked = async () => {
    if (status.key === 'ready') {
      setStatus({ key: 'sending_labeled_data' });
      await _trainModel();
    } else if (errorIsNoLabeledData()) {
      setStatus({ key: 'ready' });
    } else {
      setOpenCancelFindingSuggestions(true);
    }
  };

  const onStateSelectionChange = (values: string[]) => {
    setSuggestionStateSelection(values);
    retrieveSuggestions(pageIndex + 1, values, templateSelection);
  };

  const onTemplateSelectionChange = (values: string[]) => {
    setTemplateSelection(values);
    retrieveSuggestions(pageIndex + 1, sueggestionStateSelection, values);
  };

  const resetStateAndTemplateSelections = () => {
    setTemplateSelection([]);
    setSuggestionStateSelection([]);
    retrieveSuggestions(pageIndex + 1, [], []);
  };

  useEffect(retrieveSuggestions, [pageIndex, pageSize, filters]);
  useEffect(() => {
    if (isMounted.current) {
      retrieveSuggestions(1);
      gotoPage(0);
      setResetActivePage(true);
    } else {
      isMounted.current = true;
    }
  }, [filters]);
  useEffect(() => {
    const params = new RequestParams({
      extractorId: extractor._id,
    });
    ixStatus(params)
      .then((response: any) => {
        setStatus({ key: response.status, data: response.data, message: response.message });
      })
      .catch(() => {
        setStatus({ key: 'error' });
      });

    socket.on(
      'ix_model_status',
      (extractorId: string, modelStatus: string, _: string, data: any) => {
        if (extractorId === extractor._id) {
          setStatus({ key: modelStatus, data });
          if ((data && data.total === data.processed) || modelStatus === 'ready') {
            setStatus({ key: 'ready' });
            retrieveSuggestions();
          }
          retriveStats();
        }
      }
    );

    retriveStats();

    return () => {
      socket.off('ix_model_status');
    };
  }, []);

  const ixmessages: { [k: string]: string } = {
    ready: 'Find suggestions',
    sending_labeled_data: 'Sending labeled data...',
    processing_model: 'Training model...',
    processing_suggestions: 'Finding suggestions',
    cancel: 'Canceling...',
    error: 'Error',
  };

  const formatData = (data: { total: number; processed: number } | undefined) =>
    data ? `${data.processed}/${data.total}` : '';

  return (
    <>
      <div className="panel entity-suggestions">
        <FiltersSidePanel
          open={filtersOpen}
          reset={() => {
            resetStateAndTemplateSelections();
          }}
          hideFilters={() => {
            setFiltersOpen(false);
          }}
          templates={{
            options: aggregations.template.map(({ _id, count }) => ({
              key: _id,
              label: templateNamesById[_id],
              results: count,
            })),
            selected: templateSelection,
            setSelection: onTemplateSelectionChange,
          }}
          states={{
            options: aggregations.state.map(({ _id, count }) => ({
              key: _id,
              label: _id,
              results: count,
            })),
            selected: sueggestionStateSelection,
            setSelection: onStateSelectionChange,
          }}
        />
        <div className="dashboard-link">
          <I18NLink to="settings/metadata_extraction">
            <Icon icon="arrow-left" />
            <Translate>Back to dashboard</Translate>
          </I18NLink>
        </div>
        <div className="panel-subheading">
          <div className="property-info-container">
            <div className="property-info-heading">
              <span className="suggestion-header">
                <Translate>Reviewing</Translate>:&nbsp;
              </span>
              <span className="suggestion-property">
                <Translate>{reviewedProperty.label}</Translate>
              </span>
              <span className="suggestion-for-label">
                &nbsp; <Translate>for</Translate> &nbsp;
              </span>
              <span className="suggestion-templates">
                {extractor.templates.map(_id => (
                  <span color="segment-pdf" key={_id}>
                    {templateNamesById[_id]}
                  </span>
                ))}
              </span>
            </div>
            <div className="property-info-buttons">
              <button
                type="button"
                title={status.key !== 'ready' ? 'Cancel' : 'Train'}
                className={`btn service-request-button find-suggestions ${status.key}`}
                onClick={onFindSuggestionButtonClicked}
              >
                <Translate>{ixmessages[status.key]}</Translate> {formatData(status.data)}
              </button>
              <button
                type="button"
                className="btn suggestion-filters"
                onClick={() => setFiltersOpen(true)}
              >
                <Icon icon="filter" />
                <Translate>Show Filters</Translate>
              </button>
            </div>
          </div>
          <TrainingHealthDashboard stats={stats} />
        </div>
        <table {...getTableProps()} className="table sticky">
          <thead className="header">
            {headerGroups.map((headerGroup: HeaderGroup<EntitySuggestionType>) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => {
                  const className =
                    column.className + (filters.find(f => f.id === column.id) ? ' filtered' : '');
                  return (
                    <th {...column.getHeaderProps({ className })}>
                      {column.render('Header')}
                      {column.canFilter && column.Filter && column.render('Filter')}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row: Row<EntitySuggestionType>) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps({ className: cell.column.className })}>
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          resetActivePage={resetActivePage}
          onPageChange={gotoPage}
          onPageSizeChange={setPageSize}
          totalPages={totalPages}
        />
        <SuggestionAcceptanceModal
          isOpen={acceptingSuggestion}
          propertyType={reviewedProperty.type}
          languages={languages}
          onClose={() => {
            toggleAllRowsSelected(false);
            setAcceptingSuggestion(false);
          }}
          onAccept={async (allLanguages: boolean) => acceptSuggestion(allLanguages)}
        />
        <CancelFindingSuggestionModal
          isOpen={openCancelFindingSuggestions}
          onClose={() => setOpenCancelFindingSuggestions(false)}
          onAccept={async () => _cancelFindingSuggestions()}
        />
      </div>
      {Boolean(selectedFlatRows.length) && (
        <PDFSidePanel
          open={sidePanelOpened}
          closeSidePanel={closePDFSidePanel}
          handleSave={handlePDFSidePanelSave}
          entitySuggestion={selectedFlatRows[0].original}
        />
      )}
    </>
  );
};

export const EntitySuggestions = connect(mapStateToProps)(EntitySuggestionsComponent);
