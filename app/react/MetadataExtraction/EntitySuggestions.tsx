/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';

import { Icon } from 'UI';
import { HeaderGroup, Row } from 'react-table';
import { I18NLink, Translate } from 'app/I18N';
import { socket } from 'app/socket';
import { store } from 'app/store';
import { ClientEntitySchema } from 'app/istore';
import { Pagination } from 'app/UI/BasicTable/Pagination';
import { RequestParams } from 'app/utils/RequestParams';
import { SuggestionAcceptanceModal } from 'app/MetadataExtraction/SuggestionAcceptanceModal';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { suggestionsTable } from 'app/MetadataExtraction/SuggestionsTable';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { getSuggestionState } from 'shared/getIXSuggestionState';
import { SuggestionsStats } from 'shared/types/suggestionStats';
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

interface EntitySuggestionsProps {
  property: PropertySchema;
  acceptIXSuggestion: (suggestion: EntitySuggestionType, allLanguages: boolean) => void;
}

export const EntitySuggestions = ({
  property: reviewedProperty,
  acceptIXSuggestion,
}: EntitySuggestionsProps) => {
  const isMounted = useRef(false);
  const [suggestions, setSuggestions] = useState<EntitySuggestionType[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [resetActivePage, setResetActivePage] = useState(false);
  const [status, setStatus] = useState<{ key: string; data?: undefined }>({
    key: 'ready',
  });
  const [acceptingSuggestion, setAcceptingSuggestion] = useState(false);
  const [openCancelFindingSuggestions, setOpenCancelFindingSuggestions] = useState(false);
  const [sidePanelOpened, setSidePanelOpened] = useState(false);
  const [stats, setStats] = useState<SuggestionsStats | undefined>(undefined);

  const showConfirmationModal = (row: Row<EntitySuggestionType>) => {
    row.toggleRowSelected();
    setAcceptingSuggestion(true);
  };

  const actionsCellButtonClassNames = (state: string) => {
    let className = 'btn ';
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

  const retrieveSuggestions = (pageNumber: number = pageIndex + 1) => {
    const queryFilter = filters.reduce(
      (filteredValues, f) => ({ ...filteredValues, [f.id]: f.value }),
      {}
    );
    const params = new RequestParams({
      page: { number: pageNumber, size: pageSize },
      filter: { ...queryFilter, propertyName: reviewedProperty.name },
    });
    getSuggestions(params)
      .then((response: any) => {
        setSuggestions(response.suggestions);
        setTotalPages(response.totalPages);
      })
      .catch(() => {});
  };

  const retriveStats = () => {
    const params = new RequestParams({
      propertyName: reviewedProperty.name,
    });
    getStats(params)
      .then((response: any) => {
        setStats(response);
      })
      .catch(() => {});
  };

  const getWrappedSuggestionState = (
    acceptedSuggestion: any,
    newCurrentValue: string | number | null
  ) =>
    getSuggestionState(
      { ...acceptedSuggestion, currentValue: newCurrentValue, modelCreationDate: 0 },
      reviewedProperty.type
    );

  const acceptSuggestion = async (allLanguages: boolean) => {
    if (selectedFlatRows.length > 0) {
      const acceptedSuggestion = selectedFlatRows[0].original;
      await acceptIXSuggestion(acceptedSuggestion, allLanguages);
      let { labeledValue } = acceptedSuggestion;
      if (!labeledValue && acceptedSuggestion.selectionRectangles?.length) {
        labeledValue = acceptedSuggestion.suggestedValue;
      }
      selectedFlatRows[0].toggleRowSelected();
      selectedFlatRows[0].values.state = getWrappedSuggestionState(
        { ...acceptedSuggestion, labeledValue },
        acceptedSuggestion.suggestedValue as string
      );
      selectedFlatRows[0].values.currentValue = acceptedSuggestion.suggestedValue;
      selectedFlatRows[0].setState({});
    }

    setAcceptingSuggestion(false);
    toggleAllRowsSelected(false);
    retriveStats();
  };

  const handlePDFSidePanelSave = (entity: ClientEntitySchema) => {
    setSidePanelOpened(false);
    const changedPropertyValue = (entity[reviewedProperty.name] ||
      entity.metadata?.[reviewedProperty.name]) as string;
    selectedFlatRows[0].values.currentValue = Array.isArray(changedPropertyValue)
      ? changedPropertyValue[0].value || '-'
      : changedPropertyValue;
    selectedFlatRows[0].setState({});
    selectedFlatRows[0].toggleRowSelected();
    const acceptedSuggestion = selectedFlatRows[0].original;
    selectedFlatRows[0].values.state = getWrappedSuggestionState(
      acceptedSuggestion,
      entity.title as string
    );
    selectedFlatRows[0].setState({});
    retriveStats();
  };

  const _trainModel = async () => {
    setStatus({ key: 'sending_labeled_data' });
    const params = new RequestParams({
      property: reviewedProperty.name,
    });

    const response = await trainModel(params);
    const type = response.status === 'error' ? 'danger' : 'success';
    setStatus({ key: response.status, data: response.data });
    store?.dispatch(notify(response.message, type));
    if (status.key === 'ready') {
      await retrieveSuggestions();
    }
  };

  const _cancelFindingSuggestions = async () => {
    setOpenCancelFindingSuggestions(false);
    const params = new RequestParams({
      property: reviewedProperty.name,
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
    } else {
      setOpenCancelFindingSuggestions(true);
    }
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
      property: reviewedProperty.name,
    });
    ixStatus(params)
      .then((response: any) => {
        setStatus({ key: response.status, data: response.data });
      })
      .catch(() => {
        setStatus({ key: 'error' });
      });

    socket.on(
      'ix_model_status',
      (propertyName: string, modelStatus: string, _: string, data: any) => {
        if (propertyName === reviewedProperty.name) {
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
    cancel: 'Cancelling...',
    error: 'Error',
  };

  const formatData = (data: { total: number; processed: number } | undefined) =>
    data ? `${data.processed}/${data.total}` : '';

  return (
    <>
      <div className="panel entity-suggestions">
        <div className="dashboard-link">
          <I18NLink to="settings/metadata_extraction">
            <Icon icon="arrow-left" />
            <Translate>Back to dashboard</Translate>
          </I18NLink>
        </div>
        <div className="panel-subheading">
          <div className="property-info-container">
            <div>
              <span className="suggestion-header">
                <Translate>Reviewing</Translate>:&nbsp;
              </span>
              <span className="suggestion-property">
                <Translate>{reviewedProperty.label}</Translate>
              </span>
            </div>
            <div>
              <button
                type="button"
                title={status.key !== 'ready' ? 'Cancel' : 'Train'}
                className={`btn service-request-button ${status.key}`}
                onClick={onFindSuggestionButtonClicked}
              >
                <Translate>{ixmessages[status.key]}</Translate> {formatData(status.data)}
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
          onClose={() => setAcceptingSuggestion(false)}
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
