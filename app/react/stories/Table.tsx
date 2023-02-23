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

import { Table as FlowbiteTable } from 'flowbite-react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

type TableColumn = ReadonlyArray<
  Column<any> &
    UseSortByOptions<any> & {
      className?: string;
    }
>;

interface TableProps {
  columns: TableColumn;
  data: { [key: string]: any }[];
}

const Table = ({ columns, data }: TableProps) => {
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
      <FlowbiteTable {...getTableProps()} className="font-sans table-auto">
        <FlowbiteTable.Head className="text-xs !text-gray-500 !font-medium ">
          {headerGroups.map((headerGroup: HeaderGroup<any>) =>
            headerGroup.headers.map((column: any) => (
              <FlowbiteTable.HeadCell {...column.getHeaderProps(column.getSortByToggleProps())}>
                <div className="flex flex-row">
                  {column.render('Header')}
                  {Boolean(column.Header && !column.disableSortBy) && (
                    <ChevronUpDownIcon className="w-4" />
                  )}
                </div>
              </FlowbiteTable.HeadCell>
            ))
          )}
        </FlowbiteTable.Head>
        <FlowbiteTable.Body
          {...getTableBodyProps()}
          className="text-sm !text-gray-900  !font-semibold"
        >
          {rows.map((row: Row<any>) => {
            prepareRow(row);
            return (
              <FlowbiteTable.Row {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <FlowbiteTable.Cell {...cell.getCellProps({ className: cell.column.className })}>
                    {cell.render('Cell')}
                  </FlowbiteTable.Cell>
                ))}
              </FlowbiteTable.Row>
            );
          })}
        </FlowbiteTable.Body>
      </FlowbiteTable>
    </div>
  );
};

export { Table };
