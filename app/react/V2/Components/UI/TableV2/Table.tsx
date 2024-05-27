import React, { useEffect, useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, ColumnDef, flexRender } from '@tanstack/react-table';
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
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableRow, RowDragHandleCell } from './DnDComponents';

type TableProps<T extends { rowId: string }> = {
  data: T[];
  columns: ColumnDef<T, any>[];
  onChange?: (rows: T[]) => void;
};

const Table = <T extends { rowId: string }>({ data, columns, onChange }: TableProps<T>) => {
  const [dataState, setDataState] = useState(data);

  useEffect(() => {
    if (onChange) {
      onChange(dataState);
    }
  }, [dataState, onChange]);

  const dataIds = useMemo<UniqueIdentifier[]>(
    () => dataState.map(({ rowId }) => rowId),
    [dataState]
  );

  const memoizedColumns = useMemo<ColumnDef<T, any>[]>(
    () => [
      {
        id: 'drag-handle',
        header: 'Move',
        cell: RowDragHandleCell,
        size: 60,
      },
      ...columns,
    ],
    [columns]
  );

  const table = useReactTable({
    data: dataState,
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.rowId,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setDataState(() => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        const newState = arrayMove(dataState, oldIndex, newIndex);
        return newState;
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
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} colSpan={header.colSpan}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
            {table.getRowModel().rows.map(row => (
              <DraggableRow key={row.id} row={row} />
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
};

export { type TableProps };
export { Table };
