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
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

type TableColumn = ReadonlyArray<
  Column<any> &
    UseSortByOptions<any> & {
      className?: string;
    }
>;

interface LocalTableProps {
  /**
   * Column definition
   */
  columns: TableColumn;
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
    },
    useFilters,
    useSortBy,
    usePagination,
    useRowSelect,
    useRowState
  );

  return (
    <div className="tw-content">
      <Table {...getTableProps()} className="font-sans table-auto">
        <Table.Head className="text-xs !text-gray-500 !font-medium ">
          {headerGroups.map((headerGroup: HeaderGroup<any>) =>
            headerGroup.headers.map((column: any) => (
              <Table.HeadCell {...column.getHeaderProps(column.getSortByToggleProps())}>
                <div className="flex flex-row">
                  {column.render('Header')}
                  {Boolean(column.Header && !column.disableSortBy) && (
                    <ChevronUpDownIcon className="w-4" />
                  )}
                </div>
              </Table.HeadCell>
            ))
          )}
        </Table.Head>
        <Table.Body {...getTableBodyProps()} className="text-sm !text-gray-900  !font-semibold">
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
