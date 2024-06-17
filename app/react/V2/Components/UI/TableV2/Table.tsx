import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  getExpandedRowModel,
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
import { dndSortHandler, getDataIds } from './helpers';

//whe should mark columns as having sort arrows when defining columns
//whe should render an error if there are repeated ids

type TableProps<T extends { rowId: string; subRows?: { rowId: string }[] }> = {
  columns: ColumnDef<T, any>[];
  dataState: [state: T[], setter: React.Dispatch<React.SetStateAction<T[]>>];
  selectionState?: [state: {}, setter: React.Dispatch<React.SetStateAction<{}>>];
  sorting?: 'dnd' | 'headers';
  className?: string;
};

const Table = <T extends { rowId: string; subRows?: { rowId: string }[] }>({
  columns,
  dataState,
  selectionState,
  sorting,
  className,
}: TableProps<T>) => {
  const [state, setState] = dataState;
  const [rowSelection, setRowSelection] = selectionState || [null, null];

  const dataIds = useMemo(() => getDataIds(state), [state]);

  const memoizedColumns = useMemo<ColumnDef<T, any>[]>(() => {
    const tableColumns = [...columns];

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
      ...(rowSelection && { rowSelection }),
    },
    ...(setRowSelection && { enableRowSelection: true, onRowSelectionChange: setRowSelection }),
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.rowId,
    getSubRows: row => row.subRows || undefined,
    getExpandedRowModel: getExpandedRowModel(),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setState(() => dndSortHandler(state, dataIds, active.id, over.id));
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
