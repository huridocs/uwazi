/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';

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
import { getSuggestions, ixStatus, trainModel } from './SuggestionsAPI';
import { PDFSidePanel } from './PDFSidePanel';

interface EntitySuggestionsProps {
  property: PropertySchema;
  acceptIXSuggestion: (suggestion: EntitySuggestionType, allLanguages: boolean) => void;
}

export const EntitySuggestions = ({
  property: reviewedProperty,
  acceptIXSuggestion,
}: EntitySuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<EntitySuggestionType[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<{ key: string; data?: undefined }>({
    key: 'ready',
  });
  const [acceptingSuggestion, setAcceptingSuggestion] = useState(false);
  const [sidePanelOpened, setSidePanelOpened] = useState(false);

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
            state === SuggestionState.valueMatch ||
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
        <Translate>PDF</Translate>
      </span>
      {row.original.segment}
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

  const retrieveSuggestions = () => {
    const queryFilter = filters.reduce(
      (filteredValues, f) => ({ ...filteredValues, [f.id]: f.value }),
      {}
    );
    const params = new RequestParams({
      page: { number: pageIndex + 1, size: pageSize },
      filter: { ...queryFilter, propertyName: reviewedProperty.name },
    });
    getSuggestions(params)
      .then((response: any) => {
        setSuggestions(response.suggestions);
        setTotalPages(response.totalPages);
      })
      .catch(() => {});
  };

  const acceptSuggestion = async (allLanguages: boolean) => {
    if (selectedFlatRows.length > 0) {
      const acceptedSuggestion = selectedFlatRows[0].original;
      await acceptIXSuggestion(acceptedSuggestion, allLanguages);
      selectedFlatRows[0].toggleRowSelected();
      selectedFlatRows[0].values.state = SuggestionState.labelMatch;
      selectedFlatRows[0].values.currentValue = acceptedSuggestion.suggestedValue;
      selectedFlatRows[0].setState({});
    }

    setAcceptingSuggestion(false);
    toggleAllRowsSelected(false);
  };

  const userHasSelectedLabel = (entity: any) => {
    if (entity.__extractedMetadata.selections.length === 0) return false;
    const selection = entity.__extractedMetadata.selections.find(
      (s: any) => s.name === reviewedProperty.name
    );
    if (!selection) return false;
    return selection.selection.text === entity.title;
  };

  const calculateTemporaryState = (
    entity: ClientEntitySchema,
    suggestedValue: string,
    state: SuggestionState
  ) => {
    if (state === SuggestionState.obsolete) return state;
    const selected = userHasSelectedLabel(entity);
    const currentValue = entity.title;
    if (suggestedValue === '') {
      return selected ? SuggestionState.labelEmpty : SuggestionState.valueEmpty;
    }

    if (currentValue === suggestedValue) {
      return selected ? SuggestionState.labelMatch : SuggestionState.valueMatch;
    }

    return selected ? SuggestionState.labelMismatch : SuggestionState.valueMismatch;
  };

  // eslint-disable-next-line max-statements
  const handlePDFSidePanelSave = (entity: ClientEntitySchema) => {
    setSidePanelOpened(false);
    const changedPropertyValue = (entity[reviewedProperty.name] ||
      entity.metadata?.[reviewedProperty.name]) as string;
    selectedFlatRows[0].values.currentValue = Array.isArray(changedPropertyValue)
      ? changedPropertyValue[0].value || '-'
      : changedPropertyValue;
    selectedFlatRows[0].setState({});
    selectedFlatRows[0].toggleRowSelected();
    const { suggestedValue, state } = selectedFlatRows[0].original;
    selectedFlatRows[0].values.state = calculateTemporaryState(
      entity,
      suggestedValue as string,
      state as SuggestionState
    );
    selectedFlatRows[0].setState({});
  };

  const _trainModel = async () => {
    setStatus({ key: 'sending_labeled_data' });
    const params = new RequestParams({
      property: reviewedProperty.name,
    });

    const response = await trainModel(params);
    const type = response.status === 'error' ? 'danger' : 'success';
    setStatus({ key: response.status });
    store?.dispatch(notify(response.message, type));
    if (status.key === 'ready') {
      await retrieveSuggestions();
    }
  };

  useEffect(retrieveSuggestions, [pageIndex, pageSize, filters]);
  useEffect(() => {
    const params = new RequestParams({
      property: reviewedProperty.name,
    });
    ixStatus(params)
      .then((response: any) => {
        setStatus({ key: response.status });
      })
      .catch(() => {
        setStatus({ key: 'error' });
      });

    socket.on(
      'ix_model_status',
      (propertyName: string, modelStatus: string, _: string, data: any) => {
        if (propertyName === reviewedProperty.name) {
          setStatus({ key: modelStatus, data });
        }
      }
    );
    return () => {
      socket.off('ix_model_status');
    };
  }, []);

  const ixmessages: { [k: string]: string } = {
    ready: 'Find suggestions',
    sending_labeled_data: 'Sending labeled data...',
    processing_model: 'Training model...',
    processing_suggestions: 'Finding suggestions',
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
          <div>
            <span className="suggestion-header">
              <Translate>Reviewing</Translate>:&nbsp;
            </span>
            <span className="suggestion-property">
              <Translate>{reviewedProperty.label}</Translate>
            </span>
          </div>
          <button
            type="button"
            className={`btn service-request-button ${status}`}
            onClick={_trainModel}
          >
            <Translate>{ixmessages[status.key]}</Translate> {formatData(status.data)}
          </button>
        </div>
        <table {...getTableProps()}>
          <thead>
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
