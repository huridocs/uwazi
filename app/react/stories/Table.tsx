/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import {
  Column,
  HeaderGroup,
  useFilters,
  useRowSelect,
  useRowState,
  usePagination,
  useTable,
  useSortBy,
  UseSortByOptions,
  UseSortByColumnProps,
} from 'react-table';

import { Table as FlowbiteTable } from 'flowbite-react';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

type TableColumn<T extends object> = Column<T> &
  UseSortByOptions<any> &
  Partial<UseSortByColumnProps<T>> & { key: string | number; isSortable?: boolean };

interface TableProps {
  columns: ReadonlyArray<TableColumn<any>>;
  data: { [key: string]: any }[];
  title?: string | React.ReactNode;
  fixedColumns?: boolean;
}

const getIcon = (column: TableColumn<any>) => {
  switch (true) {
    case !column.isSorted:
      return <ChevronUpDownIcon className="w-4" />;
    case !column.isSortedDesc:
      return <ChevronUpIcon className="w-4" />;
    case column.isSortedDesc:
    default:
      return <ChevronDownIcon className="w-4" />;
  }
};

const Table = ({ columns, data, title, fixedColumns }: TableProps) => {
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
    <FlowbiteTable
      {...getTableProps()}
      className={` ${fixedColumns ? 'table-fixed' : 'table-auto'}`}
    >
      {title && (
        <caption className="p-5 text-lg font-semibold text-left bg-white text-gray-900">
          {title}
        </caption>
      )}
      <FlowbiteTable.Head>
        {headerGroups.map((headerGroup: HeaderGroup<any>) =>
          headerGroup.headers.map((column: any) => (
            <FlowbiteTable.HeadCell
              {...column.getHeaderProps(column.getSortByToggleProps())}
              key={column.key}
            >
              <div className={`text-gray-500 ${column.isSortable ? 'flex flex-row' : ''}`}>
                {column.render('Header')}
                {column.Header && column.isSortable && getIcon(column)}
              </div>
            </FlowbiteTable.HeadCell>
          ))
        )}
      </FlowbiteTable.Head>
      <FlowbiteTable.Body {...getTableBodyProps()} className="text-gray-900">
        {rows.map(row => {
          prepareRow(row);
          return (
            <FlowbiteTable.Row {...row.getRowProps()}>
              {row.cells.map(cell => (
                <FlowbiteTable.Cell key={cell.column.key.toString() + cell.row.id}>
                  {cell.render('Cell')}
                </FlowbiteTable.Cell>
              ))}
            </FlowbiteTable.Row>
          );
        })}
      </FlowbiteTable.Body>
    </FlowbiteTable>
  );
};

export { Table };
