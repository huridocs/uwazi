import React, { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  getExpandedRowModel,
  SortingState,
  getSortedRowModel,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableRow, RowDragHandleCell, DnDHeader } from './DnDComponents';
import { IndeterminateCheckboxHeader, IndeterminateCheckboxRow } from './RowSelectComponents';
import { dndSortHandler, getRowIds } from './helpers';
import { SortingChevrons } from './SortingChevrons';
import { GroupCell, GroupHeader } from './GroupComponents';

type TableRow<T> = {
  rowId: string;
  disableRowSelection?: boolean;
  subRows?: (T & { rowId: string; disableRowSelection?: boolean })[];
};

type TableProps<T extends TableRow<T>> = {
  columns: ColumnDef<T, any>[];
  data: T[];
  onChange?: ({
    rows,
    selectedRows,
    sortingState,
  }: {
    rows: T[];
    selectedRows: RowSelectionState;
    sortingState: SortingState;
  }) => void;
  dnd?: { enable?: boolean; disableEditingGroups?: boolean };
  enableSelections?: boolean;
  defaultSorting?: SortingState;
  sortingFn?: (sorting: SortingState) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

const Table = <T extends TableRow<T>>({
  columns,
  data,
  onChange,
  dnd,
  enableSelections,
  defaultSorting,
  sortingFn,
  header,
  footer,
  className,
}: TableProps<T>) => {
  const [dataState, setDataState] = useState(data);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sortingState, setSortingState] = useState<SortingState>(defaultSorting || []);

  const rowIds = useMemo(() => getRowIds(dataState), [dataState]);
  const { memoizedColumns, groupColumnIndex } = useMemo<{
    memoizedColumns: ColumnDef<T, any>[];
    groupColumnIndex: number;
    // eslint-disable-next-line max-statements
  }>(() => {
    const tableColumns = [...columns];
    const hasGroups = data.find(item => item.subRows);
    let calculatedIndex = 0;

    if (hasGroups) {
      tableColumns.unshift({
        id: 'group-button',
        cell: GroupCell,
        header: GroupHeader,
        meta: { headerClassName: 'w-0' },
      });
    }

    if (enableSelections) {
      calculatedIndex += 1;
      tableColumns.unshift({
        id: 'select',
        header: IndeterminateCheckboxHeader,
        cell: IndeterminateCheckboxRow,
        meta: { headerClassName: 'w-0' },
      });
    }

    if (dnd?.enable) {
      calculatedIndex += 1;
      tableColumns.unshift({
        id: 'drag-handle',
        cell: RowDragHandleCell,
        header: DnDHeader,
        meta: { headerClassName: 'w-0' },
      });
    }

    return {
      memoizedColumns: tableColumns,
      groupColumnIndex: calculatedIndex,
    };
  }, [columns, data, enableSelections, dnd]);

  const table = useReactTable({
    data: dataState,
    columns: memoizedColumns,
    state: {
      sorting: sortingState,
      ...(rowSelection && { rowSelection }),
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualSorting: Boolean(sortingFn),
    onSortingChange: setSortingState,
    getRowId: row => row.rowId,
    getSubRows: row => row.subRows || undefined,
    ...(enableSelections && {
      //There seems to be a problem with react table types when using a function, typing as any
      //fixes the issue
      enableRowSelection: (row: any) => row.original.disableRowSelection !== true,
      onRowSelectionChange: setRowSelection,
    }),
  });

  useEffect(() => {
    setDataState(data);
    setRowSelection({});
  }, [data]);

  useEffect(() => {
    if (onChange) {
      if (sortingState.length) {
        const sortedState = table.getSortedRowModel().rows.map(row => row.original);
        onChange({ rows: sortedState, selectedRows: rowSelection, sortingState });
      } else {
        onChange({ rows: dataState, selectedRows: rowSelection, sortingState });
      }
    }
    // 'onChange' and 'table' removed from deps to avoid infinite rerenders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataState, rowSelection, sortingState]);

  useEffect(() => {
    if (sortingFn) {
      sortingFn(sortingState);
    }
  }, [sortingFn, sortingState]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setDataState(() => {
        let tableRows = dataState;
        if (sortingState.length) {
          table.resetSorting();
          tableRows = table.getSortedRowModel().rows.map(row => row.original);
        }
        return dndSortHandler({
          currentState: tableRows,
          dataIds: rowIds,
          activeId: active.id,
          overId: over.id,
          disableEditingGroups: dnd?.disableEditingGroups,
        });
      });
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="w-full overflow-auto rounded-md shadow">
        <table className={`w-full ${className || ''}`}>
          {header && <caption className="p-4">{header}</caption>}

          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(hdr => {
                  const headerSorting = hdr.column.getCanSort();
                  const customClassName = hdr.column.columnDef.meta?.headerClassName;

                  return (
                    <th
                      key={hdr.id}
                      colSpan={hdr.colSpan}
                      scope="col"
                      className={`p-4 text-sm text-gray-500 uppercase border-b ${customClassName}`}
                      onClick={headerSorting ? hdr.column.getToggleSortingHandler() : undefined}
                    >
                      <span
                        className={`flex ${headerSorting ? 'gap-2 cursor-pointer select-none' : ''}`}
                      >
                        {flexRender(hdr.column.columnDef.header, hdr.getContext())}
                        {headerSorting && <SortingChevrons sorting={hdr.column.getIsSorted()} />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
              {table.getRowModel().rows.map(row => (
                <DraggableRow
                  key={row.id}
                  row={row}
                  colSpan={memoizedColumns.length}
                  groupColumnIndex={groupColumnIndex}
                  dndEnabled={!!dnd?.enable}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
        {footer && <div className="p-4">{footer}</div>}
      </div>
    </DndContext>
  );
};

export type { TableProps, TableRow };
export { Table };
