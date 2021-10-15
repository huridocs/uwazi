/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { Column, HeaderGroup, Row, useTable } from 'react-table';
import { SuggestionType } from 'shared/types/suggestionType';
import { I18NLink, Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { getSuggestions } from 'app/MetadataExtraction/SuggestionsAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { Pagination } from 'app/UI/BasicTable/Pagination';

interface EntitySuggestionsProps {
  propertyName: string;
  suggestions: SuggestionType[];
}
export const EntitySuggestions = ({ propertyName = 'Other' }: EntitySuggestionsProps) => {
  const [suggestions, setSuggestions] = useState([]);

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);

  const retrieveSuggestions = () => {
    const params = new RequestParams({
      page: pageIndex,
      limit: pageSize,
    });

    getSuggestions(params)
      .then((response: any) => {
        setSuggestions(response.suggestions);
        setTotalPages(response.totalPages);
      })
      .catch(() => {});
  };

  useEffect(retrieveSuggestions, [pageIndex, pageSize]);

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
      },
      {
        accessor: 'page' as const,
        Header: () => <Translate>Page</Translate>,
      },
    ],
    []
  );

  const hiddenColumns = propertyName === 'Title' ? ['title'] : [];
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data: suggestions,
    initialState: {
      hiddenColumns,
    },
  });

  const handlePageChange = (pageNumber: number) => {
    setPageIndex(pageNumber);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
  };

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
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps({ className: column.className })}>
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row: Row<SuggestionType>) => {
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
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        totalPages={totalPages}
      />
    </div>
  );
};
