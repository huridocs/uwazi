import React, { useEffect, useMemo, useState } from 'react';
import {
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getExpandedRowModel,
} from '@tanstack/react-table';
import { useIsFirstRender } from 'app/V2/CustomHooks';
import { TableProps, CheckBoxHeader, CheckBoxCell } from './TableElements';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';

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
  const [sortedChanged, setSortedChanged] = useState(false);
  const isFirstRender = useIsFirstRender();

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
    enableRowSelection: (row: any) =>
      Boolean(enableSelection && !row.original?.disableRowSelection),
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

  useEffect(() => {
    if (isFirstRender) {
      return;
    }

    const sorted = table.getRowModel().rows.map(row => row.original);
    onChange(sorted);
    setSortedChanged(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortingState]);

  useEffect(() => {
    const selectedRows = table.getSelectedRowModel().flatRows;
    if (onSelection) {
      onSelection(selectedRows);
    }
  }, [onSelection, rowSelection, table]);

  const handleOnChange = (changedItems: T[]) => {
    setSortedChanged(true);
    onChange(changedItems);
  };

  return (
    <div className="overflow-x-auto relative rounded-md border border-gray-50 shadow-sm">
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
              sortedChanged={sortedChanged}
            />
          ))}
        </thead>
        <TableBody
          draggableRows={draggableRows}
          items={data}
          table={table}
          subRowsKey={subRowsKey}
          onChange={handleOnChange}
        />
      </table>
      {footer && <div className="p-4">{footer}</div>}
    </div>
  );
};

export { Table };
