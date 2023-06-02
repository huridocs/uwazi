/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-multi-comp */
import React, { useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import {
  TableProps,
  CheckBoxHeader,
  CheckBoxCell,
  getIcon,
  ColumnWithClassName,
} from './TableTypes';

const applyForSelection = (
  withSelection: any,
  withOutSelection: any,
  enableSelection: boolean = false
) => (enableSelection ? withSelection : withOutSelection);
// eslint-disable-next-line comma-spacing
const Table = <T,>({
  columns,
  data,
  title,
  initialState,
  enableSelection,
  onSelection,
}: TableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>(initialState?.sorting || []);
  const [rowSelection, setRowSelection] = useState({});

  const memoizedColumns = useMemo(
    () => [
      ...applyForSelection(
        [
          {
            ...{
              id: 'checkbox-select',
              header: CheckBoxHeader,
              cell: CheckBoxCell,
            },
            className: 'w-0',
          },
        ],
        [],
        enableSelection
      ),
      ...columns,
    ],
    [columns, enableSelection]
  );

  const memoizedData = useMemo<T[]>(() => data, [data]);

  const table = useReactTable({
    columns: memoizedColumns,
    data: memoizedData,
    initialState,
    state: {
      sorting,
      ...applyForSelection({ rowSelection }, {}, enableSelection),
    },
    enableRowSelection: enableSelection,
    onRowSelectionChange: applyForSelection(setRowSelection, () => undefined, enableSelection),
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    const selectedRows = table.getSelectedRowModel().flatRows;

    if (onSelection) {
      onSelection(selectedRows);
    }
  }, [onSelection, rowSelection, table]);

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
                const isSelect = header.column.id === 'checkbox-select';
                const headerClassName = `${isSelect ? 'px-2' : 'px-6'} py-3 ${
                  (header.column.columnDef as ColumnWithClassName<T>).className || ''
                }`;

                return (
                  <th key={header.id} scope="col" className={headerClassName}>
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
              {row.getVisibleCells().map(cell => {
                const isSelect = cell.column.id === 'checkbox-select';

                return (
                  <td key={cell.id} className={`${isSelect ? 'px-2' : 'px-6'} py-3`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export { Table };
