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
import { DraggableRow, RowDragHandleCell, DnDHeader } from './DnDComponents';
import { IndeterminateCheckboxHeader, IndeterminateCheckboxRow } from './RowSelectComponents';

type TableProps<T extends { rowId: string }> = {
  data: T[];
  columns: ColumnDef<T, any>[];
  onChange?: (rows: T[]) => void;
  onSelect?: (selected: { [id: string]: boolean }) => void;
  sorting?: 'dnd' | 'headers';
  checkboxes?: boolean;
  className?: string;
};

const Table = <T extends { rowId: string }>({
  data,
  columns,
  onChange,
  onSelect,
  sorting,
  checkboxes,
  className,
}: TableProps<T>) => {
  const [dataState, setDataState] = useState(data);
  const [rowSelection, setRowSelection] = useState({});

  const dataIds = useMemo<UniqueIdentifier[]>(
    () => dataState.map(({ rowId }) => rowId),
    [dataState]
  );

  const memoizedColumns = useMemo<ColumnDef<T, any>[]>(() => {
    const tableColumns = [...columns];

    if (checkboxes) {
      tableColumns.unshift({
        id: 'select',
        header: IndeterminateCheckboxHeader,
        cell: IndeterminateCheckboxRow,
      });
    }

    if (sorting === 'headers') {
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
  }, [checkboxes, columns, sorting]);

  const table = useReactTable({
    data: dataState,
    columns: memoizedColumns,
    state: {
      ...(checkboxes && { rowSelection }),
    },
    ...(checkboxes && { enableRowSelection: true, onRowSelectionChange: setRowSelection }),
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.rowId,
  });

  useEffect(() => {
    if (onChange) {
      onChange(dataState);
    }
  }, [dataState, onChange]);

  useEffect(() => {
    if (onSelect) {
      onSelect(rowSelection);
    }
  }, [rowSelection, onSelect]);

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
      <table className={`w-full ${className || ''}`}>
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
