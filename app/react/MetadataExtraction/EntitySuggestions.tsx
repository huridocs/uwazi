/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Column, HeaderGroup, Row, useTable } from 'react-table';
import { SuggestionsSampleData } from 'app/MetadataExtraction/SuggestionsSampleData';
import { SuggestionType } from 'shared/types/suggestionType';
import { Translate, I18NLink } from 'app/I18N';
import { Icon } from 'app/UI';

const suggestionCell = ({ row }: { row: Row<SuggestionType> }) => {
  const suggestion = row.original;
  const currentValue = suggestion.currentValue || '-';
  return (
    <>
      <h5>
        <Translate>Title</Translate>
      </h5>
      <p>{currentValue}</p>
      <h5>
        <Translate>Suggestion</Translate>
      </h5>
      <p className="suggested-value">{suggestion.suggestedValue}</p>
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

export const EntitySuggestions = () => {
  const suggestions: SuggestionType[] = React.useMemo(() => SuggestionsSampleData, []);

  const columns: Column<SuggestionType>[] = React.useMemo(
    () => [
      {
        id: 'suggestion',
        Header: () => <Translate>Title / Suggestion</Translate>,
        Cell: suggestionCell,
      },
      {
        id: 'action',
        Header: () => <Translate>Action</Translate>,
        Cell: actionsCell,
      },
      {
        accessor: 'segment' as const,
        Header: () => <Translate>Segment</Translate>,
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

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data: suggestions,
  });

  return (
    <div className="panel entity-suggestions">
      <div className="panel-subheading">
        <div>
          <span className="suggestion-header">
            <Translate>Reviewing</Translate>:&nbsp;
          </span>
          <span className="suggestion-property">
            <Translate>Title</Translate>
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
