import React from 'react';
import { Column, HeaderGroup, Row, useTable } from 'react-table';
import { SuggestionsSampleData } from 'app/MetadataExtraction/SuggestionsSampleData';
import { SuggestionType } from 'shared/types/suggestionType';
import { Translate } from 'app/I18N/components/Translate';
import { Icon } from 'app/UI';

export const EntitySuggestions = () => {
  const suggestions: SuggestionType[] = React.useMemo(() => SuggestionsSampleData, []);
  const columns: Column<SuggestionType>[] = React.useMemo(
    () => [
      {
        Header: 'Title / Suggestion',
        Cell: ({ row }: { row: Row<SuggestionType> }) => {
          const suggestion = row.original;
          return (
            <>
              <h5>
                <Translate>Title</Translate>
              </h5>
              <p>
                <Translate>{suggestion.currentValue || '-'}</Translate>
              </p>
              <h5>
                <Translate>Suggestion</Translate>
              </h5>
              <p className="label-primary">
                <Translate>{suggestion.suggestedValue}</Translate>
              </p>
            </>
          );
        },
      },
      {
        Header: 'Action',
        Cell: () => (
          <div>
            <button type="button" className="btn btn-outline-primary">
              <Icon icon="check" />
              &nbsp;
              <Translate>Accept</Translate>
            </button>
          </div>
        ),
      },
      {
        Header: 'Segment',
        accessor: 'segment' as const,
      },
      {
        Header: 'Language',
        accessor: 'language' as const,
      },
      {
        Header: 'State',
        accessor: 'state' as const,
      },
      {
        Header: 'Page',
        accessor: 'page' as const,
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data: suggestions,
  });

  return (
    <div className="entity-suggestions">
      <Translate>Reviewing</Translate>: Title
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
