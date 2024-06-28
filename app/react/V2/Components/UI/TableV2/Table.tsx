import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  getExpandedRowModel,
  SortingState,
  getSortedRowModel,
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
  UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableRow, RowDragHandleCell, DnDHeader } from './DnDComponents';
import { IndeterminateCheckboxHeader, IndeterminateCheckboxRow } from './RowSelectComponents';
import { dndSortHandler, getRowIds, sortHandler, equalityById } from './helpers';
import { SortingChevrons } from './SortingChevrons';
import { GroupCell, GroupHeader } from './GroupComponents';

type RowWithId<T extends { rowId: string }> = {
  rowId: string;
  subRows?: T[];
};

type TableProps<T extends RowWithId<T>> = {
  columns: ColumnDef<T, any>[];
  dataState: [state: T[], setter?: React.Dispatch<React.SetStateAction<T[]>>];
  selectionState?: [state: {}, setter: React.Dispatch<React.SetStateAction<{}>>];
  sorting?: 'dnd' | 'headers';
  className?: string;
};

const Table = <T extends RowWithId<T>>({
  columns,
  dataState,
  selectionState,
  sorting,
  className,
}: TableProps<T>) => {
  const [state, setState] = dataState;
  const [rowSelection, setRowSelection] = selectionState || [null, null];
  const [sortingState, setSortingState] = useState<SortingState>([]);
  const rowIds = useMemo(() => getRowIds(state), [state]);

  const originalRowIds = useRef<{ id: UniqueIdentifier; parentId?: string }[]>([...rowIds]);
  const originalState = useRef([...state]);

  const memoizedColumns = useMemo<ColumnDef<T, any>[]>(() => {
    const tableColumns = [...columns];
    const hasGroups = state.find(item => item.subRows);

    if (hasGroups) {
      tableColumns.unshift({
        id: 'group-button',
        cell: GroupCell,
        header: GroupHeader,
      });
    }

    if (rowSelection) {
      tableColumns.unshift({
        id: 'select',
        header: IndeterminateCheckboxHeader,
        cell: IndeterminateCheckboxRow,
      });
    }

    if (sorting === 'dnd') {
      tableColumns.unshift({
        id: 'drag-handle',
        cell: RowDragHandleCell,
        header: DnDHeader,
        size: 60,
      });
    }

    return tableColumns;
  }, [columns, rowSelection, sorting]);

  const table = useReactTable({
    data: state,
    columns: memoizedColumns,
    state: {
      sorting: sortingState,
      ...(rowSelection && { rowSelection }),
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSortingState,
    getRowId: row => row.rowId,
    getSubRows: row => row.subRows || undefined,
    ...(setRowSelection && { enableRowSelection: true, onRowSelectionChange: setRowSelection }),
  });

  useEffect(() => {
    const isEqual = equalityById(originalRowIds.current, rowIds);

    if (!isEqual) {
      originalState.current = [...state];
      originalRowIds.current = [...rowIds];
      if (setRowSelection) {
        setRowSelection({});
      }
    }
  }, [rowIds]);

  useEffect(() => {
    if (setState) {
      if (sortingState.length === 0) {
        setState(originalState.current);
      } else {
        const { rows } = table.getSortedRowModel();
        setState(sortHandler(rows));
      }
    }
  }, [sortingState]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      if (setState) {
        setState(() => dndSortHandler(state, rowIds, active.id, over.id));
      }
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
      <table className={`w-full ${className || ''}`}>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const headerSorting = sorting === 'headers' && header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    onClick={headerSorting ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div
                      className={`flex ${headerSorting ? 'gap-2 cursor-pointer select-none' : ''}`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {headerSorting && <SortingChevrons sorting={header.column.getIsSorted()} />}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            {table.getRowModel().rows.map(row => (
              <DraggableRow key={row.id} row={row} />
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
};

export type { TableProps, RowWithId };
export { Table };
