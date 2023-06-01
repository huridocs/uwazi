import React, { useMemo, useState } from 'react';
import {
  flexRender,
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  SortingState,
  TableState,
  ColumnDef,
  CellContext,
  Column,
} from '@tanstack/react-table';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

type ColumnWithClassName<T> = ColumnDef<T, any> & {
  className?: string;
};

type CellContextWithMeta<T, U> = CellContext<T, U> & {
  column: Column<T> & { columnDef: ColumnWithClassName<T> };
};

interface TableProps<T> {
  columns: ColumnWithClassName<T>[];
  data: T[];
  title?: string | React.ReactNode;
  initialState?: Partial<TableState>;
}

const getIcon = (sorting: false | 'asc' | 'desc') => {
  switch (sorting) {
    case false:
      return <ChevronUpDownIcon className="w-4" />;
    case 'asc':
      return <ChevronUpIcon className="w-4" />;
    case 'desc':
    default:
      return <ChevronDownIcon className="w-4" />;
  }
};

// eslint-disable-next-line comma-spacing
const Table = <T,>({ columns, data, title, initialState }: TableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>(initialState?.sorting || []);

  const memoizedColumns = useMemo(() => columns, [columns]);
  const memoizedData = useMemo<T[]>(() => data, [data]);

  const table = useReactTable({
    columns: memoizedColumns,
    data: memoizedData,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full text-sm text-left">
        {title && (
          <caption className="p-5 text-lg font-semibold text-left text-gray-900 bg-white">
            {title}
          </caption>
        )}

        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const isSortable = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={`px-6 py-3 ${
                      (header.column.columnDef as ColumnWithClassName<T>).className
                    }`}
                  >
                    <div
                      className={`inline-flex ${isSortable ? 'cursor-pointer select-none' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {isSortable && getIcon(header.column.getIsSorted())}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="bg-white border-b">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export type { CellContextWithMeta, ColumnWithClassName };

export { Table };
