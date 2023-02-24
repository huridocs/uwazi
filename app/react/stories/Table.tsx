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
  UseSortByColumnProps,
} from 'react-table';

import { Table as FlowbiteTable } from 'flowbite-react';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

type TableColumn<T extends object> = Column<T> &
  UseSortByOptions<any> &
  Partial<UseSortByColumnProps<T>>;

interface TableProps {
  columns: ReadonlyArray<TableColumn<any>>;
  data: { [key: string]: any }[];
  title?: string;
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

const Table = ({ columns, data, title }: TableProps) => {
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
    <FlowbiteTable {...getTableProps()}>
      {title && (
        <caption className="p-5 text-lg font-semibold text-left text-gray-900 bg-white">
          {title}
        </caption>
      )}
      <FlowbiteTable.Head>
        {headerGroups.map((headerGroup: HeaderGroup<any>) =>
          headerGroup.headers.map((column: any) => (
            <FlowbiteTable.HeadCell {...column.getHeaderProps(column.getSortByToggleProps())}>
              <div className="flex flex-row">
                {column.render('Header')}
                {column.Header && !column.disableSortBy && getIcon(column)}
              </div>
            </FlowbiteTable.HeadCell>
          ))
        )}
      </FlowbiteTable.Head>
      <FlowbiteTable.Body {...getTableBodyProps()}>
        {rows.map((row: Row<any>) => {
          prepareRow(row);
          return (
            <FlowbiteTable.Row {...row.getRowProps()}>
              {row.cells.map(cell => (
                <FlowbiteTable.Cell>{cell.render('Cell')}</FlowbiteTable.Cell>
              ))}
            </FlowbiteTable.Row>
          );
        })}
      </FlowbiteTable.Body>
    </FlowbiteTable>
  );
};

export { Table };
