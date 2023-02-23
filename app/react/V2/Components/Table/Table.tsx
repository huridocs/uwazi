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
import { Table as FTable } from 'flowbite-react';
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
  title?: string | React.ReactNode;
}

export const Table = ({ columns, data, title }: TableProps) => {
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
    <FTable {...getTableProps()}>
      {title && (
        <caption className="p-5 text-lg font-semibold text-left text-gray-900 bg-white">
          {title}
        </caption>
      )}
      <FTable.Head>
        {headerGroups.map((headerGroup: HeaderGroup<any>) =>
          headerGroup.headers.map((column: any) => (
            <FTable.HeadCell {...column.getHeaderProps(column.getSortByToggleProps())}>
              <div className="flex flex-row">
                {column.render('Header')}
                {Boolean(column.Header && !column.disableSortBy) && (
                  <ChevronUpDownIcon className="w-4" />
                )}
              </div>
            </FTable.HeadCell>
          ))
        )}
      </FTable.Head>
      <FTable.Body {...getTableBodyProps()}>
        {rows.map((row: Row<any>) => {
          prepareRow(row);
          return (
            <FTable.Row {...row.getRowProps()}>
              {row.cells.map(cell => (
                <FTable.Cell {...cell.getCellProps({ className: cell.column.className })}>
                  {cell.render('Cell')}
                </FTable.Cell>
              ))}
            </FTable.Row>
          );
        })}
      </FTable.Body>
    </FTable>
  );
};
