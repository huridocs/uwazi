/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo } from 'react';
import {
  Column,
  HeaderGroup,
  useRowSelect,
  useRowState,
  useTable,
  useSortBy,
  UseSortByOptions,
  UseSortByColumnProps,
  TableState,
} from 'react-table';

import { Table as FlowbiteTable } from 'flowbite-react';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

type TableColumn<T extends object> = Column<T> &
  UseSortByOptions<any> &
  Partial<UseSortByColumnProps<T>> & {
    disableSortBy?: boolean;
    className?: string;
  };

interface TableProps {
  columns: ReadonlyArray<TableColumn<any>>;
  data: { [key: string]: any }[];
  title?: string | React.ReactNode;
  initialState?: Partial<TableState<any>>;
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

const Table = ({ columns, data, title, initialState }: TableProps) => {
  const memoizedColumns = useMemo(() => columns, [columns]);
  const memoizedData = useMemo(() => data, [data]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns: memoizedColumns,
      data: memoizedData,
      initialState,
    },
    useSortBy,
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
            <FlowbiteTable.HeadCell
              {...column.getHeaderProps(column.getSortByToggleProps())}
              className={column.className}
            >
              <div className={`text-gray-500 ${!column.disableSortBy ? 'flex flex-row' : ''}`}>
                {column.render('Header')}
                {column.Header && !column.disableSortBy && getIcon(column)}
              </div>
            </FlowbiteTable.HeadCell>
          ))
        )}
      </FlowbiteTable.Head>
      <FlowbiteTable.Body {...getTableBodyProps()} className="text-gray-900 divide-y">
        {rows.map(row => {
          prepareRow(row);
          return (
            <FlowbiteTable.Row {...row.getRowProps()}>
              {row.cells.map(cell => (
                <FlowbiteTable.Cell {...cell.getCellProps()}>
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
