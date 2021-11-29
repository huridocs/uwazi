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
import { t, Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { Pagination } from 'app/UI/BasicTable/Pagination';
import { RequestParams } from 'app/utils/RequestParams';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { PropertySchema } from 'shared/types/commonTypes';
import { getSuggestions } from './SuggestionsAPI';

interface EntitySuggestionsProps {
  property: PropertySchema;
  onClose: () => void;
}

const stateFilter = ({ column: { filterValue, setFilter } }: FilterProps<IXSuggestionType>) => (
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
  onClose,
}: EntitySuggestionsProps) => {
  const [suggestions, setSuggestions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  const suggestionCell = ({ row }: { row: Row<IXSuggestionType> }) => {
    const suggestion = row.original;
    const currentValue = suggestion.currentValue || '-';
    return (
      <>
        <div>
          <span className="suggestion-label">
            <Translate>{reviewedProperty.label}</Translate>
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

  const columns: Column<IXSuggestionType>[] = React.useMemo(
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
        Cell: ({ row }: { row: Row<IXSuggestionType> }) => (
          <Translate>{row.original.language}</Translate>
        ),
      },
      {
        accessor: 'state' as const,
        Header: () => <Translate>State</Translate>,
        Cell: ({ row }: { row: Row<IXSuggestionType> }) => (
          <Translate>{row.original.state || ''}</Translate>
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

  useEffect(retrieveSuggestions, [pageIndex, pageSize, filters]);

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
        <button className="btn btn-outline-primary" onClick={() => onClose()}>
          <Translate>Dashboard</Translate>
        </button>
      </div>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup: HeaderGroup<IXSuggestionType>) => (
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
          {page.map((row: Row<IXSuggestionType>) => {
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
