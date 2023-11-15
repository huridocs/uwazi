import React, { useEffect, useMemo, useState } from 'react';
import {
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getExpandedRowModel,
  Row,
} from '@tanstack/react-table';
import { TableProps, CheckBoxHeader, CheckBoxCell } from './TableElements';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TableRow } from './TableRow';
import { useDnDTable } from './useDnDTable';

const applyForSelection = (
  withSelection: any,
  withOutSelection: any,
  enableSelection: boolean = false
) => (enableSelection ? withSelection : withOutSelection);

// eslint-disable-next-line comma-spacing, max-statements
const Table = <T,>({
  columns,
  data,
  title,
  footer,
  initialState,
  enableSelection,
  sorting,
  setSorting,
  onSelection,
  subRowsKey,
  draggableRows = false,
  onChange = () => {},
}: TableProps<T>) => {
  const manualSorting = Boolean(setSorting);
  const [internalSorting, setInternalSortingSorting] = useState<SortingState>(
    initialState?.sorting || []
  );
  const [rowSelection, setRowSelection] = useState({});
  const [internalData, setInternalData] = useState(data);

  useEffect(() => {
    setRowSelection({});
    setInternalData(data);
  }, [data]);

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

  const sortingState = manualSorting ? sorting : internalSorting;
  const sortingFunction = manualSorting ? setSorting : setInternalSortingSorting;

  const table = useReactTable({
    columns: memoizedColumns,
    manualSorting,
    data: internalData,
    initialState,
    state: {
      sorting: sortingState,
      ...applyForSelection({ rowSelection }, {}, enableSelection),
    },
    enableRowSelection: enableSelection,
    enableSubRowSelection: false,
    onRowSelectionChange: applyForSelection(setRowSelection, () => undefined, enableSelection),
    onSortingChange: sortingFunction,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row: any) => {
      if (subRowsKey) {
        return row[subRowsKey];
      }
      return [];
    },
  });

  const { dndContext } = useDnDTable<T>(
    draggableRows,
    table,
    {
      getDisplayName: item => item.id!,
      itemsProperty: subRowsKey,
      onChange,
    },
    [internalData, setInternalData]
  );
  useEffect(() => {
    const selectedRows = table.getSelectedRowModel().flatRows;
    if (onSelection) {
      onSelection(selectedRows);
    }
  }, [onSelection, rowSelection, table]);

  return (
    <div className="relative overflow-x-auto border rounded-md shadow-sm border-gray-50">
      <table className="w-full text-sm text-left" data-testid="table">
        {title && (
          <caption className="p-4 text-base font-semibold text-left text-gray-900 bg-white">
            {title}
          </caption>
        )}

        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <TableHeader
              key={headerGroup.id}
              headerGroup={headerGroup}
              draggableRows={draggableRows}
            />
          ))}
        </thead>
        <TableBody draggableRows={draggableRows} dndContext={dndContext}>
          {table.getRowModel().rows.map((item: Row<T>) => (
            <TableRow<T>
              key={item.id}
              row={item}
              draggableRow={draggableRows === true}
              dndContext={dndContext}
              enableSelection
            />
          ))}
        </TableBody>
      </table>
      {footer && <div className="p-4">{footer}</div>}
    </div>
  );
};

export { Table };
