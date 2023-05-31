import React, { useState } from 'react';
import {
  flexRender,
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  AccessorFn,
  SortingState,
} from '@tanstack/react-table';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

type Column = {
  header: string;
  accessor: AccessorFn<any>;
  id?: string;
  cell?: (value: any) => React.ReactNode;
  enableSorting?: boolean;
  className?: string;
};

interface TableProps {
  columns: Column[];
  data: { [key: string]: any }[];
  title?: string | React.ReactNode;
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

const Table = ({ columns, data, title }: TableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columnHelper = createColumnHelper();

  const constructedColumns = columns.map(column => ({
    ...columnHelper.accessor(column.accessor, {
      id: column.id || column.accessor.toString(),
      cell: info => (column.cell ? column.cell(info.getValue()) : info.renderValue()),
      header: column.header,
      enableSorting: column.enableSorting,
    }),
    ...{ className: column.className },
  }));

  const table = useReactTable({
    columns: constructedColumns,
    data,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="relative overflow-x-auto">
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
                    className={`px-6 py-3 ${(header.column.columnDef as Column).className}`}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex gap-1 ${isSortable ? 'cursor-pointer select-none' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSortable && getIcon(header.column.getIsSorted())}
                      </div>
                    )}
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

export { Table };
