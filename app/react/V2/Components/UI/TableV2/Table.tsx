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

type RowWithId<T extends { rowId: string }> = {
  rowId: string;
  subRows?: T[];
};

type TableProps<T extends RowWithId<T>> = {
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

const Table = <T extends RowWithId<T>>({
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
  }>(() => {
    const tableColumns = [...columns];
    const hasGroups = data.find(item => item.subRows);

    if (hasGroups) {
      tableColumns.unshift({
        id: 'group-button',
        cell: GroupCell,
        header: GroupHeader,
        size: 80,
      });
    }

    if (enableSelections) {
      tableColumns.unshift({
        id: 'select',
        header: IndeterminateCheckboxHeader,
        cell: IndeterminateCheckboxRow,
        size: 0,
      });
    }

    if (dnd?.enable) {
      tableColumns.unshift({
        id: 'drag-handle',
        cell: RowDragHandleCell,
        header: DnDHeader,
        size: 0,
      });
    }

    return {
      memoizedColumns: tableColumns,
      groupColumnIndex: 0 + Number(enableSelections) + Number(dnd?.enable),
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
    ...(setRowSelection && { enableRowSelection: true, onRowSelectionChange: setRowSelection }),
  });

  useEffect(() => {
    setDataState(data);
  }, [data]);

  useEffect(() => {
    if (onChange) {
      let updatedData = dataState;
      if (sortingState.length) {
        updatedData = table.getSortedRowModel().rows.map(row => row.original);
      }
      onChange({ rows: updatedData, selectedRows: rowSelection, sortingState });
    }
  }, [dataState, onChange, rowSelection, sortingState, table]);

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
      <div className="rounded-md shadow">
        <table className={`w-full table-fixed ${className || ''}`}>
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
                      className={`p-4 text-sm text-gray-500 uppercase border-b ${customClassName}`}
                      style={{ width: hdr.column.getSize() }}
                      onClick={headerSorting ? hdr.column.getToggleSortingHandler() : undefined}
                    >
                      <span
                        className={`flex  ${headerSorting ? 'gap-2 cursor-pointer select-none' : ''}`}
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

export type { TableProps, RowWithId };
export { Table };
