import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { cloneDeep } from 'lodash';
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
  data: T[];
  setData?: React.Dispatch<React.SetStateAction<T[]>>;
  selectionState?: [state: {}, setter: React.Dispatch<React.SetStateAction<{}>>];
  dndEnabled?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

const Table = <T extends RowWithId<T>>({
  columns,
  data,
  setData,
  selectionState,
  dndEnabled,
  header,
  footer,
  className,
}: TableProps<T>) => {
  const rowIds = useMemo(() => getRowIds(data), [data]);
  const [rowSelection, setRowSelection] = selectionState || [null, null];
  const [sortingState, setSortingState] = useState<SortingState>([]);
  const originalState = useRef<T[]>();
  const originalRowIds = useRef<{ id: UniqueIdentifier; parentId?: string }[]>();

  if (!originalState.current) originalState.current = cloneDeep(data);
  if (!originalRowIds.current) originalRowIds.current = [...rowIds];

  const memoizedColumns = useMemo<ColumnDef<T, any>[]>(() => {
    const tableColumns = [...columns];
    const hasGroups = data.find(item => item.subRows);

    if (hasGroups) {
      tableColumns.unshift({
        id: 'group-button',
        cell: GroupCell,
        header: GroupHeader,
        size: 0,
      });
    }

    if (rowSelection) {
      tableColumns.unshift({
        id: 'select',
        header: IndeterminateCheckboxHeader,
        cell: IndeterminateCheckboxRow,
        size: 0,
      });
    }

    if (dndEnabled) {
      tableColumns.unshift({
        id: 'drag-handle',
        cell: RowDragHandleCell,
        header: DnDHeader,
        size: 0,
      });
    }

    return tableColumns;
  }, [columns, rowSelection, dndEnabled]);

  const table = useReactTable({
    data,
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
    const isEqual = equalityById(originalRowIds.current!, rowIds);

    if (!isEqual) {
      originalState.current = cloneDeep(data);
      originalRowIds.current = [...rowIds];
      if (setRowSelection) {
        setRowSelection({});
      }
    }
  }, [rowIds]);

  useEffect(() => {
    if (setData) {
      if (sortingState.length === 0) {
        setData(originalState.current!);
      } else {
        const { rows } = table.getSortedRowModel();
        setData(sortHandler(rows));
      }
    }
  }, [sortingState]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      if (setData) {
        setData(() => dndSortHandler(data, rowIds, active.id, over.id));
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
      <div className="rounded-md shadow">
        <table className={`w-full ${className || ''}`}>
          {header && <caption className="p-4">{header}</caption>}

          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((hdr, index) => {
                  const headerSorting = hdr.column.getCanSort();
                  let calculatedPadding = '';

                  if (index === 0) {
                    calculatedPadding = 'pl-4';
                  } else if (index === headerGroup.headers.length - 1) {
                    calculatedPadding = 'pr-4';
                  }

                  return (
                    <th
                      key={hdr.id}
                      colSpan={hdr.colSpan}
                      className={`py-4 border-b ${calculatedPadding}`}
                      onClick={headerSorting ? hdr.column.getToggleSortingHandler() : undefined}
                    >
                      <span
                        className={`flex uppercase text-gray-500 text-sm ${headerSorting ? 'gap-2 cursor-pointer select-none' : ''}`}
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
                <DraggableRow key={row.id} row={row} />
              ))}
            </SortableContext>
          </tbody>
        </table>
        {footer && <div className="p-4">{footer}</div>}
      </div>
    </DndContext>
  );
};

export type { TableProps, RowWithId };
export { Table };
