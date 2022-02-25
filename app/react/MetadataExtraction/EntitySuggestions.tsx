/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';

import { Icon } from 'UI';
import { HeaderGroup, Row } from 'react-table';
import { I18NLink, Translate } from 'app/I18N';
import { socket } from 'app/socket';
import { store } from 'app/store';
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
  const [suggestions, setSuggestions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('ready');
  const [acceptingSuggestion, setAcceptingSuggestion] = useState(false);
  const [sidePanelOpened, setSidePanelOpened] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState({});

  socket.on('ix_model_status', (propertyName: string, modelStatus: string) => {
    if (propertyName === reviewedProperty.name) {
      setStatus(modelStatus);
    }
  });

  const showConfirmationModal = (row: Row<EntitySuggestionType>) => {
    row.toggleRowSelected();
    setAcceptingSuggestion(true);
  };

  const actionsCell = ({ row }: { row: Row<EntitySuggestionType> }) => {
    const suggestion = row.original;
    return (
      <div>
        {suggestion.state !== SuggestionState.matching && (
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={async () => showConfirmationModal(row)}
          >
            <Icon icon="check" />
            &nbsp;
            <Translate>Accept</Translate>
          </button>
        )}
      </div>
    );
  };

  // TEST!!!

  const showPDF = (row: Row<EntitySuggestionType>) => {
    setSelectedRowData(row.original);
    setSidePanelOpened(true);
  };

  const closePDFSidePanel = () => {
    setSidePanelOpened(false);
  };

  const segmentCell = ({ row }: { row: Row<EntitySuggestionType> }) => (
    <>
      <button type="button" onClick={() => showPDF(row)}>
        PDF
      </button>
      {row.original.segment}
    </>
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
    setAcceptingSuggestion(false);
    if (selectedFlatRows.length > 0) {
      const acceptedSuggestion = selectedFlatRows[0].original;
      await acceptIXSuggestion(acceptedSuggestion, allLanguages);
      selectedFlatRows[0].toggleRowSelected();
      retrieveSuggestions();
    }
  };

  const _trainModel = async () => {
    const params = new RequestParams({
      property: reviewedProperty.name,
    });

    const response = await trainModel(params);
    const type = response.status === 'error' ? 'danger' : 'success';
    setStatus(response.status);
    store?.dispatch(notify(response.message, type));
    if (status === 'ready') {
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
        setStatus(response.status);
      })
      .catch(() => {
        setStatus('error');
      });
  }, []);

  const ixmessages: { [k: string]: string } = {
    ready: 'Find suggestions',
    processing_model: 'Training model...',
    processing_suggestions: 'Finding suggestions...',
    error: 'Error',
  };

  return (
    <>
      <div className="panel entity-suggestions">
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
            <Translate>{ixmessages[status]}</Translate>
          </button>
          <I18NLink to="settings/metadata_extraction" className="btn btn-outline-primary">
            <Translate>Dashboard</Translate>
          </I18NLink>
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
                      <>
                        {column.render('Header')}
                        {column.canFilter && column.Filter && column.render('Filter')}
                      </>
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
          onClose={() => setAcceptingSuggestion(false)}
          onAccept={async (allLanguages: boolean) => acceptSuggestion(allLanguages)}
        />
      </div>
      <PDFSidePanel
        open={sidePanelOpened}
        closeSidePanel={closePDFSidePanel}
        entitySuggestion={selectedRowData}
      />
    </>
  );
};
