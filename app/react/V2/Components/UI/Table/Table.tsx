/* eslint-disable max-lines */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Translate } from '#app/I18N/index.js';
import { DraggableRow, RowDragHandleCell, DnDHeader } from './DnDComponents.js';
import {
  IndeterminateCheckboxHeaderCell,
  IndeterminateCheckboxRow,
} from './RowSelectComponents.js';
import { dndSortHandler, getRowIds } from './helpers.js';
import { SortingChevrons } from './SortingChevrons.js';
import { GroupCell, GroupHeader } from './GroupComponents.js';
import { NoDataRow } from './NoDataRow.js';
import { DefaultNoDataMessage } from './DefaultNoDataMessage.js';
import { Button } from '../Button.js';

type TableRow<T> = {
  rowId: string;
  disableRowSelection?: boolean | string | React.ReactNode;
  disableRowDnD?: boolean;
  subRows?: T[];
};

type TableProps<T extends TableRow<T>> = {
  columns: ColumnDef<T, any>[];
  data: T[];
  onSelect?: (args: { rows: T[]; selectedRows: RowSelectionState }) => void;
  onSort?: (args: { rows: T[]; sortingState: SortingState }) => void;
  dnd?: { enable?: boolean; disableEditingGroups?: boolean };
  enableSelections?: boolean;
  initialSelection?: T[];
  defaultSorting?: SortingState;
  header?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  noDataMessage?: string | React.ReactNode;
  className?: string;
  containerClassName?: string;
  groupColumnPosition?: number;
  manualSorting?: boolean;
  focusedRowId?: string;
  focusedRowClassName?: string;
  getRowClassName?: (row: T) => string;
  selectAllCheckboxId?: string;
};

const Table = <T extends TableRow<T>>({
  columns,
  data,
  onSelect,
  dnd,
  enableSelections,
  defaultSorting,
  onSort,
  header,
  actions,
  footer,
  className,
  containerClassName,
  noDataMessage = <DefaultNoDataMessage />,
  groupColumnPosition = 0,
  initialSelection = [],
  manualSorting,
  focusedRowId,
  focusedRowClassName = 'bg-parchment',
  getRowClassName,
  selectAllCheckboxId = 'checkbox-header',
}: TableProps<T>) => {
  const isProgrammaticSelectionUpdate = useRef(false);
  const [dataState, setDataState] = useState(data);
  const externalSelectionKey = useMemo(
    () =>
      initialSelection
        .map(item => item.rowId)
        .sort()
        .join(','),
    [initialSelection]
  );
  const initialRowSelection = useMemo(
    () => initialSelection.reduce((acc, item) => ({ ...acc, [item.rowId]: true }), {}),
    [externalSelectionKey, initialSelection]
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialRowSelection);
  const [sorting, setSorting] = useState<SortingState>(defaultSorting || []);

  const selectionStateKey = useCallback(
    (state: RowSelectionState) =>
      Object.keys(state)
        .filter(id => state[id])
        .sort()
        .join(','),
    []
  );

  const applyRowSelection = useCallback(
    (next: RowSelectionState) => {
      setRowSelection(prev => {
        if (selectionStateKey(prev) === selectionStateKey(next)) {
          return prev;
        }
        isProgrammaticSelectionUpdate.current = true;
        return next;
      });
    },
    [selectionStateKey]
  );

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
      const groupColumn = {
        id: 'group-button',
        cell: GroupCell,
        header: GroupHeader,
        meta: { headerClassName: 'w-0' },
      };
      tableColumns.splice(groupColumnPosition, 0, groupColumn);
    }
    if (enableSelections) {
      calculatedIndex += 1;
      tableColumns.unshift({
        id: 'select',
        header: IndeterminateCheckboxHeaderCell,
        cell: IndeterminateCheckboxRow,
        meta: { headerClassName: 'w-0', selectAllCheckboxId },
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
    return { memoizedColumns: tableColumns, groupColumnIndex: calculatedIndex };
  }, [columns, data, enableSelections, dnd, selectAllCheckboxId]);

  const table = useReactTable({
    data: dataState,
    columns: memoizedColumns,
    state: {
      sorting,
      ...(rowSelection && { rowSelection }),
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualSorting,
    onSortingChange: setSorting,
    getRowId: row => row.rowId,
    getSubRows: row => row.subRows || undefined,
    ...(enableSelections && {
      enableRowSelection: (row: any) => !row.original.disableRowSelection,
      onRowSelectionChange: setRowSelection,
    }),
  });

  useEffect(() => {
    setDataState(data);
    applyRowSelection(initialRowSelection);
  }, [data, applyRowSelection, initialRowSelection]);

  useEffect(() => {
    applyRowSelection(initialRowSelection);
  }, [applyRowSelection, externalSelectionKey, initialRowSelection]);

  useEffect(() => {
    if (isProgrammaticSelectionUpdate.current) {
      isProgrammaticSelectionUpdate.current = false;
      return;
    }
    if (onSelect) {
      const rows = table.getSortedRowModel().rows.map(row => row.original);
      onSelect({ rows, selectedRows: rowSelection });
    }
  }, [rowSelection]);

  useEffect(() => {
    if (onSort) {
      const rows = table.getSortedRowModel().rows.map(row => row.original);
      onSort({ sortingState: sorting, rows });
    }
  }, [sorting]);

  const collapseAll = () => {
    table.getRowModel().rows.forEach(row => {
      row.toggleExpanded(false);
    });
  };

  const expandAll = () => {
    table.getRowModel().rows.forEach(row => {
      if (Array.isArray(row.original.subRows)) {
        row.toggleExpanded(true);
      }
    });
  };

  // eslint-disable-next-line max-statements
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const overRow = dataState.find(row => row.rowId === over?.id);
    const activeRow = dataState.find(row => row.rowId === active.id);

    if (overRow?.disableRowDnD || activeRow?.disableRowDnD) {
      return;
    }

    if (active && over && active.id !== over.id) {
      let tableRows = dataState;
      if (sorting.length) {
        table.resetSorting();
        tableRows = table.getSortedRowModel().rows.map(row => row.original);
      }
      const newDataState = dndSortHandler({
        currentState: tableRows,
        dataIds: rowIds,
        activeId: active.id,
        overId: over.id,
        disableEditingGroups: dnd?.disableEditingGroups,
      });
      if (onSort) {
        onSort({ sortingState: sorting, rows: newDataState });
      }
      setDataState(newDataState);
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const hasGroups = dataState.some(row => row.subRows);
  const canExpand = table
    .getRowModel()
    .rows.some(row => row.getCanExpand() && !row.getIsExpanded());
  const canCollapse = table.getRowModel().rows.some(row => row.getIsExpanded());

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div
        className={`flex w-full flex-col overflow-auto rounded-md shadow-sm ${containerClassName || ''}`}
        style={{
          backgroundColor: 'var(--color-theme-surface-raised)',
          boxShadow: 'var(--color-theme-card-shadow)',
        }}
      >
        {(header || actions || hasGroups) && (
          <div
            data-testid="table-header"
            className="flex items-center justify-between gap-4 p-4"
            style={{
              backgroundColor: 'var(--color-theme-surface-raised)',
              color: 'var(--color-theme-text-primary)',
            }}
          >
            {header && <div className="grow">{header}</div>}
            <div className="flex gap-2">
              {hasGroups && (
                <>
                  <Button disabled={!canCollapse} variant="ghost" onClick={collapseAll}>
                    <Translate>Collapse all</Translate>
                  </Button>
                  <Button disabled={!canExpand} variant="ghost" onClick={expandAll}>
                    <Translate>Expand all</Translate>
                  </Button>
                </>
              )}
              {actions}
            </div>
          </div>
        )}
        <table className={`w-full ${className || ''}`}>
          <thead className="bg-(--color-theme-section-header-bg)">
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
                      className={`border-b p-4 text-sm uppercase text-section-header ${customClassName || ''}`}
                      style={{
                        borderColor:
                          'color-mix(in srgb, var(--color-theme-border-default) 40%, transparent)',
                      }}
                      onClick={headerSorting ? hdr.column.getToggleSortingHandler() : undefined}
                    >
                      <span
                        className={`${headerSorting ? 'flex gap-2 cursor-pointer select-none' : ''}`}
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
            {dataState.length === 0 && (
              <NoDataRow colSpan={memoizedColumns.length} DisplayElement={noDataMessage} />
            )}
            {dataState.length > 0 && (
              <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                {table.getRowModel().rows.map(row => (
                  <DraggableRow
                    key={row.id}
                    row={row}
                    colSpan={memoizedColumns.length}
                    groupColumnIndex={groupColumnIndex}
                    dndEnabled={!!dnd?.enable}
                    rowClassName={[
                      row.original.rowId === focusedRowId ? focusedRowClassName : '',
                      getRowClassName?.(row.original) || '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                ))}
              </SortableContext>
            )}
          </tbody>
        </table>
      </div>
      {footer && dataState.length > 0 && (
        <div
          className="border-t p-4"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-theme-border-default) 40%, transparent)',
            backgroundColor: 'var(--color-theme-surface-raised)',
          }}
        >
          {footer}
        </div>
      )}
    </DndContext>
  );
};

export type { TableProps, TableRow };
export { Table };
