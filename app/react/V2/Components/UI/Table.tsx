/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import {
  flexRender,
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  AccessorFn,
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
  // const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
  //   {
  //     columns: memoizedColumns,
  //     data: memoizedData,
  //     initialState,
  //   },
  //   useSortBy,
  //   useRowSelect,
  //   useRowState
  // );

  const columnHelper = createColumnHelper();

  const constructedColumns = columns.map(column =>
    columnHelper.accessor(column.accessor, {
      id: column.id || column.accessor,
      cell: info => (column.cell ? column.cell(info.getValue()) : info.renderValue()),
      header: column.header,
    })
  );

  const table = useReactTable({
    columns: constructedColumns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>

      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export { Table };
