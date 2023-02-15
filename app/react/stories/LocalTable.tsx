/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import {
  Column,
  HeaderGroup,
  Row,
  useFilters,
  useRowSelect,
  useRowState,
  usePagination,
  useTable,
  useSortBy,
  UseSortByOptions,
} from 'react-table';

import { Table } from 'flowbite-react';

interface LocalTableProps {
  /**
   * Column definition
   */
  columns: ReadonlyArray<Column<any> & UseSortByOptions<any>>;
  /**
   * Data content
   */
  data: { [key: string]: any }[];
}

export const LocalTable = ({ columns, data }: LocalTableProps) => {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: [
          {
            id: 'title',
            desc: false,
          },
        ],
      },
    },
    useFilters,
    useSortBy,
    usePagination,
    useRowSelect,
    useRowState
  );

  return (
    <div className="tw-content">
      <Table {...getTableProps()}>
        <Table.Head>
          {headerGroups.map((headerGroup: HeaderGroup<any>) =>
            headerGroup.headers.map((column: any) => (
              <Table.HeadCell
                {...column.getHeaderProps(column.getSortByToggleProps())}
                className={column.isSorted ? (column.isSortedDesc ? 'desc' : 'asc') : ''}
              >
                {column.render('Header')}
              </Table.HeadCell>
            ))
          )}
        </Table.Head>
        <Table.Body {...getTableBodyProps()}>
          {rows.map((row: Row<any>) => {
            prepareRow(row);
            return (
              <Table.Row {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <Table.Cell {...cell.getCellProps({ className: cell.column.className })}>
                    {cell.render('Cell')}
                  </Table.Cell>
                ))}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
};
