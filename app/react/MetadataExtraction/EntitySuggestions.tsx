import React from 'react';
import { useTable } from 'react-table';
import Translate from 'app/I18N/components/Translate';
import { Icon } from 'UI';

export const EntitySuggestions = () => {
  const data = React.useMemo(
    () => [
      {
        title: 'Temporary entity title',
        suggestion: 'HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali',
        segment:
          'Lorem ipsum dolor HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali sit amet, consectetur adipiscing elit. Quisque augue nisi, venenatis eget dictum vel, scelerisque vitae felis. Suspendisse sed eleifend neque, non volutpat ex. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris semper auctor aliquam. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
        language: 'English',
        state: 'Filled',
        page: 1,
      },
      {
        suggestion: 'HCT-04-CR-SC-0080-2008: Uganda vs Okiring J.',
        segment:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque augue nisi, HCT-04-CR-SC-0080-2008: Uganda vs Okiring J.venenatis eget dictum vel, scelerisque vitae felis. Suspendisse sed eleifend neque, non volutpat ex. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris semper auctor aliquam. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
        language: 'English',
        state: 'Empty',
        page: 1,
      },
      {
        title: 'Succession (Amendment) Decree, 1972',
        suggestion: 'Succession (Amendment)',
        segment:
          'Lorem ipsum dolor HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali sit amet, consectetur adipiscing elit. Quisque augue nisi, Succession (Amendment) Decree, 1972venenatis eget dictum vel, scelerisque vitae felis. Suspendisse sed eleifend neque, non volutpat ex. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris semper auctor aliquam. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
        language: 'English',
        state: 'Filled',
        page: 1,
      },
      {
        title: 'Temporary entity title',
        suggestion: 'Succession Act - Chapter 162',
        segment:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque augue nisi, venenatis eget dictum vel, scelerisque vitae felis. Succession Act - Chapter 162 Suspendisse sed eleifend neque, non volutpat ex. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris semper auctor aliquam. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
        language: 'English',
        state: 'Filled',
        page: 1,
      },
      {
        title: 'Temporary entity title',
        suggestion: 'Prevention of Trafficking in Persons Act',
        segment:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque augue nisi, venenatis eget dictum vel, scelerisque vitae felis. Suspendisse sed eleifend neque, non volutpat ex. Prevention of Trafficking in Persons Act Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris semper auctor aliquam. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
        language: 'English',
        state: 'Filled',
        page: 1,
      },
      {
        title: 'Temporary entity title',
        suggestion: 'Prevention of Trafficking in Persons Act',
        segment:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque augue nisi, venenatis eget dictum vel, scelerisque vitae felis. Penal Code (Amendment) Act Suspendisse sed eleifend neque, non volutpat ex. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris semper auctor aliquam. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
        language: 'English',
        state: 'Filled',
        page: 1,
      },
    ],
    []
  );
  const columns = React.useMemo(
    () => [
      {
        Header: 'Title / Suggestion',
        accessor: 'title' as const,
        Cell: ({ row }) => (
          <>
            <h5>
              <Translate>Title</Translate>
            </h5>
            <p>
              <Translate>{row.original.title}</Translate>
            </p>
            <h5>
              <Translate>Suggestion</Translate>
            </h5>
            <p className="label-primary">
              <Translate>{row.original.suggestion}</Translate>
            </p>
          </>
        ),
      },
      {
        Header: 'Action',
        accessor: 'action' as const,
        Cell: () => (
          <div>
            <button type="button" className="btn btn-outline-primary">
              <Icon icon="check" />
              &nbsp;
              <Translate>Accept</Translate>
            </button>
            <button type="button" className="btn btn-outline-primary">
              <Icon icon="bullseye" />
              &nbsp;
              <Translate>Mark</Translate>
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
    data,
  });

  return (
    <div className="entity-suggestions">
      Reviewing: Title
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
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
