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
} from 'react-table';
import { I18NLink, t, Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { Pagination } from 'app/UI/BasicTable/Pagination';
import { RequestParams } from 'app/utils/RequestParams';
import { SuggestionType } from 'shared/types/suggestionType';
import { getSuggestions } from './SuggestionsAPI';

interface EntitySuggestionsProps {
  propertyName: string;
}

const stateFilter = ({ column: { filterValue, setFilter } }: FilterProps<SuggestionType>) => (
  <select
    className={filterValue ? 'filtered' : ''}
    value={filterValue}
    onChange={e => {
      setFilter(e.target.value || undefined);
    }}
  >
    <option value="">{t('System', 'All', 'All', false)}</option>
    <option value="Filled">{t('System', 'Filled', 'Filled', false)}</option>
    <option value="Empty">{t('System', 'Empty', 'Empty', false)}</option>
  </select>
);

export const EntitySuggestions = ({ propertyName = 'Other' }: EntitySuggestionsProps) => {
  const [suggestions, setSuggestions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  const suggestionCell = ({ row }: { row: Row<SuggestionType> }) => {
    const suggestion = row.original;
    const currentValue = suggestion.currentValue || '-';
    return (
      <>
        <div>
          <span className="suggestion-label">
            <Translate>{propertyName}</Translate>
          </span>
          <p>{currentValue}</p>
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

  const actionsCell = () => (
    <div>
      <button type="button" className="btn btn-outline-primary">
        <Icon icon="check" />
        &nbsp;
        <Translate>Accept</Translate>
      </button>
    </div>
  );

  const columns: Column<SuggestionType>[] = React.useMemo(
    () => [
      {
        id: 'suggestion',
        Header: () => (
          <>
            <Translate>{propertyName}</Translate> / <Translate>Suggestion</Translate>
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
        id: 'title',
        accessor: 'title' as const,
        Header: () => <Translate>Title</Translate>,
        className: 'title',
      },
      {
        accessor: 'segment' as const,
        Header: () => <Translate>Segment</Translate>,
        className: propertyName === 'Title' ? 'long-segment' : 'segment',
      },
      {
        accessor: 'language' as const,
        Header: () => <Translate>Language</Translate>,
        Cell: ({ row }: { row: Row<SuggestionType> }) => (
          <Translate>{row.original.language}</Translate>
        ),
      },
      {
        accessor: 'state' as const,
        Header: () => <Translate>State</Translate>,
        Cell: ({ row }: { row: Row<SuggestionType> }) => (
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
  const hiddenColumns = propertyName === 'Title' ? ['title'] : [];

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    gotoPage,
    setPageSize,
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
    usePagination
  );

  const retrieveSuggestions = () => {
    const params = new RequestParams({
      page: pageIndex + 1,
      limit: pageSize,
      filters,
    });
    getSuggestions(params)
      .then((response: any) => {
        setSuggestions(response.suggestions);
        setTotalPages(response.totalPages);
      })
      .catch(() => {});
  };

  useEffect(retrieveSuggestions, [pageIndex, pageSize, filters]);

  return (
    <div className="panel entity-suggestions">
      <div className="panel-subheading">
        <div>
          <span className="suggestion-header">
            <Translate>Reviewing</Translate>:&nbsp;
          </span>
          <span className="suggestion-property">
            <Translate>{propertyName}</Translate>
          </span>
        </div>
        <I18NLink to="settings/metadata_extraction" className="btn btn-outline-primary">
          <Translate>Dashboard</Translate>
        </I18NLink>
      </div>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup: HeaderGroup<SuggestionType>) => (
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
          {page.map((row: Row<SuggestionType>) => {
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
    </div>
  );
};
