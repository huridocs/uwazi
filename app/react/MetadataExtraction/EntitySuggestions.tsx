/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Column, HeaderGroup, Row, useTable } from 'react-table';
import { SuggestionsSampleData } from 'app/MetadataExtraction/SuggestionsSampleData';
import { SuggestionType } from 'shared/types/suggestionType';
import { Translate, I18NLink } from 'app/I18N';
import { Icon } from 'app/UI';

interface EntitySuggestionsProps {
  propertyName: string;
  suggestions: SuggestionType[];
}
export const EntitySuggestions = ({
  propertyName = 'Title',
  suggestions = SuggestionsSampleData,
}: EntitySuggestionsProps) => {
  const suggestionsData: SuggestionType[] = React.useMemo(() => suggestions, []);

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
      },
      {
        id: 'action',
        Header: () => <Translate>Action</Translate>,
        Cell: actionsCell,
      },
      {
        id: 'title',
        accessor: 'title' as const,
        Header: () => <Translate>Title</Translate>,
      },
      {
        accessor: 'segment' as const,
        Header: () => <Translate>Segment</Translate>,
        width: '45%',
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
    data: suggestionsData,
    initialState: {
      hiddenColumns,
    },
  });

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
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
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
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
