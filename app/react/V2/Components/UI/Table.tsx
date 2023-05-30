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
  className?: string;
};

interface TableProps {
  columns: Column[];
  data: { [key: string]: any }[];
  title?: string | React.ReactNode;
  initialState?;
}

// const getIcon = (column: TableColumn<any>) => {
//   switch (true) {
//     case !column.isSorted:
//       return <ChevronUpDownIcon className="w-4" />;
//     case !column.isSortedDesc:
//       return <ChevronUpIcon className="w-4" />;
//     case column.isSortedDesc:
//     default:
//       return <ChevronDownIcon className="w-4" />;
//   }
// };

const Table = ({ columns, data, title, initialState }: TableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columnHelper = createColumnHelper();

  const constructedColumns = columns.map(column =>
    columnHelper.accessor(column.accessor, {
      id: column.id || column.accessor.toString(),
      cell: info => (column.cell ? column.cell(info.getValue()) : info.renderValue()),
      header: column.header,
    })
  );

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
              {headerGroup.headers.map(header => (
                <th key={header.id} scope="col" className="px-6 py-3">
                  {header.isPlaceholder ? null : (
                    <div
                      {...{
                        className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' asc',
                        desc: ' desc',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </th>
              ))}
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
