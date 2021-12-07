/* eslint-disable max-statements */
/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';

import {
  Column,
  HeaderGroup,
  Row,
  useTable,
  usePagination,
  useFilters,
  FilterProps,
  useRowSelect,
} from 'react-table';
import { t, Translate } from 'app/I18N';
import socket from 'app/socket';
import { Icon } from 'app/UI';
import { store } from 'app/store';
import { Pagination } from 'app/UI/BasicTable/Pagination';
import { RequestParams } from 'app/utils/RequestParams';
import { SuggestionAcceptanceModal } from 'app/MetadataExtraction/SuggestionAcceptanceModal';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { getSuggestions, trainModel, ixStatus } from './SuggestionsAPI';

interface EntitySuggestionsProps {
  property: PropertySchema;
  acceptIXSuggestion: (suggestion: EntitySuggestionType, allLanguages: boolean) => void;
}

const stateFilter = ({ column: { filterValue, setFilter } }: FilterProps<EntitySuggestionType>) => (
  <select
    className={filterValue ? 'filtered' : ''}
    value={filterValue}
    onChange={e => {
      setFilter(e.target.value || undefined);
    }}
  >
    <option value="">{t('System', 'All', 'All', false)}</option>
    <option value="Matching">{t('System', 'Matching', 'Matching', false)}</option>
    <option value="Empty">{t('System', 'Empty', 'Empty', false)}</option>
    <option value="Pending">{t('System', 'Pending', 'Pending', false)}</option>
  </select>
);

export const EntitySuggestions = ({
  property: reviewedProperty,
  acceptIXSuggestion,
}: EntitySuggestionsProps) => {
  const [suggestions, setSuggestions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('ready');
  const [acceptingSuggestion, setAcceptingSuggestion] = useState(false);

  socket.on('ix_model_status', (propertyName: string, modelStatus: string) => {
    if (propertyName === reviewedProperty.name) {
      setStatus(modelStatus);
    }
  });

  const showConfirmationModal = (row: Row<EntitySuggestionType>) => {
    row.toggleRowSelected();
    setAcceptingSuggestion(true);
  };

  const suggestionCell = ({ row }: { row: Row<EntitySuggestionType> }) => {
    const suggestion = row.original;
    const currentValue = suggestion.currentValue || '-';
    return (
      <>
        <div>
          <span className="suggestion-label">
            <Translate>{reviewedProperty.label}</Translate>
          </span>
          <p className="current-value">{currentValue}</p>
        </div>
        <div>
          <span className="suggestion-label">
            <Translate>Suggestion</Translate>
          </span>
          <p className="suggested-value">{suggestion.suggestedValue}</p>
        </div>
      </>
    );
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

  const columns: Column<EntitySuggestionType>[] = React.useMemo(
    () => [
      {
        id: 'suggestion',
        Header: () => (
          <>
            <Translate>{reviewedProperty.label}</Translate> / <Translate>Suggestion</Translate>
          </>
        ),
        Cell: suggestionCell,
        className: 'suggestion',
      },
      {
        id: 'action',
        Header: () => <Translate>Action</Translate>,
        Cell: actionsCell,
        className: 'action',
      },
      {
        id: 'entityTitle',
        accessor: 'entityTitle' as const,
        Header: () => <Translate>Title</Translate>,
        className: 'title',
      },
      {
        accessor: 'segment' as const,
        Header: () => <Translate>Segment</Translate>,
        className: reviewedProperty.label === 'Title' ? 'long-segment' : 'segment',
      },
      {
        accessor: 'language' as const,
        Header: () => <Translate>Language</Translate>,
        Cell: ({ row }: { row: Row<EntitySuggestionType> }) => (
          <Translate>{row.original.language}</Translate>
        ),
      },
      {
        accessor: 'state' as const,
        Header: () => <Translate>State</Translate>,
        Cell: ({ row }: { row: Row<EntitySuggestionType> }) => (
          <Translate>{row.original.state}</Translate>
        ),
        Filter: stateFilter,
        className: 'state',
      },
      {
        accessor: 'page' as const,
        Header: () => <Translate>Page</Translate>,
      },
    ],
    []
  );
  const hiddenColumns = reviewedProperty.label === 'Title' ? ['entityTitle'] : [];

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
  } = useTable(
    {
      columns,
      data: suggestions,
      manualPagination: true,
      manualFilters: true,
      initialState: {
        hiddenColumns,
        pageIndex: 0,
        pageSize: 5,
      },

      pageCount: totalPages,
      autoResetPage: false,
      autoResetFilters: false,
    },

    useFilters,
    usePagination,
    useRowSelect
  );

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

  const acceptSuggestion = (allLanguages: boolean) => {
    if (selectedFlatRows.length > 0) {
      const acceptedSuggestion = selectedFlatRows[0].original;
      acceptIXSuggestion(acceptedSuggestion, allLanguages);
      selectedFlatRows[0].toggleRowSelected();
      setAcceptingSuggestion(false);
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
  };

  useEffect(retrieveSuggestions, [pageIndex, pageSize, filters]);
  useEffect(() => {
    const params = new RequestParams({
      property: reviewedProperty.name,
    });
    ixStatus(params)
      .then((response: any) => {
        console.log(response);
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

  function onClose() {}

  return (
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
        <button className="btn btn-outline-primary" onClick={() => onClose()}>
          <Translate>Dashboard</Translate>
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
      <Pagination onPageChange={gotoPage} onPageSizeChange={setPageSize} totalPages={totalPages} />
      <SuggestionAcceptanceModal
        isOpen={acceptingSuggestion}
        onClose={() => setAcceptingSuggestion(false)}
        onAccept={allLanguages => acceptSuggestion(allLanguages)}
      />
    </div>
  );
};
