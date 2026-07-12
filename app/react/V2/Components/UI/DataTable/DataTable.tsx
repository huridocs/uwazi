/* eslint-disable react/no-multi-comp */
/* eslint-disable max-lines */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ExpandedState,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  Bars3Icon,
} from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';
import type {
  DataTableColumn,
  DataTableReorder,
  DataTableSelection,
  DataTableSort,
  DataTableTree,
} from './types.js';

const CARD_SHADOW = 'var(--color-theme-card-shadow)';
const CARD_RADIUS = 'var(--color-theme-card-radius, var(--radius-md))';
const BORDER_COLOR = 'var(--color-theme-border-primary)';

const alignClass = {
  left: '',
  center: 'justify-center text-center',
  right: 'justify-end text-right',
} as const;

const ROW_BASE =
  'group grid gap-3 items-center text-sm px-4 min-h-11 py-2 transition-colors focus:outline-hidden focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color-mix(in_srgb,var(--color-theme-text-primary)_20%,transparent)]';

interface DataTableProps<T extends { rowId: string }> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyState?: React.ReactNode;
  footer?: React.ReactNode;
  sort?: DataTableSort;
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  selectedRowId?: string | null;
  selection?: DataTableSelection<T>;
  reorder?: DataTableReorder<T>;
  tree?: DataTableTree<T>;
  /** Applies extra px offset for minimum-width scroll containment */
  minWidthRem?: number;
}

const SortIcon = ({ sortKey, sort }: { sortKey: string; sort?: DataTableSort }) => {
  if (!sort || sort.key !== sortKey) {
    return (
      <ChevronUpDownIcon className="w-3 h-3 opacity-0 group-hover/sort:opacity-50 shrink-0 transition-opacity" />
    );
  }
  return sort.dir === 'asc' ? (
    <ChevronUpIcon className="w-3 h-3 shrink-0" />
  ) : (
    <ChevronDownIcon className="w-3 h-3 shrink-0" />
  );
};

const GripHandle = ({
  listeners,
  attributes,
  isDragging,
}: {
  listeners?: Record<string, any>;

  attributes?: Record<string, any>;
  isDragging: boolean;
}) => (
  /* eslint-disable react/jsx-props-no-spreading */
  <button
    type="button"
    {...listeners}
    {...attributes}
    className={`p-0.5 text-ink-muted hover:text-ink-secondary transition-colors ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
  >
    <Bars3Icon className="w-4 h-4" />
    <span className="sr-only">
      <Translate>Drag row</Translate>
    </span>
  </button>
  /* eslint-enable react/jsx-props-no-spreading */
);

const ExpandButton = ({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={e => {
      e.stopPropagation();
      onToggle();
    }}
    className="p-0.5 rounded text-ink-tertiary hover:bg-warm hover:text-ink transition-colors shrink-0"
  >
    {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
  </button>
);

const SortableRow = <T extends { rowId: string }>({
  row,
  gridTemplateColumns,
  columns,
  reorderEnabled,
  treeEnabled,
  isSelected,
  isClickable,
  depth,
  onRowClick,
}: {
  row: import('@tanstack/react-table').Row<T>;
  gridTemplateColumns: string;
  columns: DataTableColumn<T>[];
  reorderEnabled: boolean;
  treeEnabled: boolean;
  isSelected: boolean;
  isClickable: boolean;
  depth: number;
  onRowClick?: (row: T) => void;
}) => {
  const { setNodeRef, transform, transition, isDragging, listeners, attributes } = useSortable({
    id: row.id,
  });

  const draggingStyle = isDragging
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: 0.85,
        zIndex: 1,
        position: 'relative' as const,
        outline: '2px solid var(--color-theme-accent-primary)',
      }
    : { transform: CSS.Transform.toString(transform), transition };

  return (
    <>
      <div
        ref={setNodeRef}
        role={isClickable ? 'button' : 'row'}
        tabIndex={isClickable ? 0 : undefined}
        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
        onKeyDown={
          isClickable
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowClick?.(row.original);
                }
              }
            : undefined
        }
        className={`${ROW_BASE} ${isClickable ? 'cursor-pointer' : ''} ${isSelected ? 'bg-parchment' : 'hover:bg-warm'}`}
        style={{
          gridTemplateColumns,
          borderBottom: `1px solid ${BORDER_COLOR}`,
          paddingLeft: depth > 0 ? `${depth * 1.5 + 1}rem` : undefined,
          ...draggingStyle,
        }}
      >
        {reorderEnabled && (
          <GripHandle listeners={listeners} attributes={attributes} isDragging={isDragging} />
        )}
        {treeEnabled && row.originalSubRows && (
          <ExpandButton expanded={row.getIsExpanded()} onToggle={() => row.toggleExpanded()} />
        )}
        {columns.map((col, i) => (
          <div
            key={col.id}
            className={`flex items-center min-w-0 text-ink ${alignClass[col.align ?? 'left']}`}
          >
            {col.cell(row.original, i)}
          </div>
        ))}
      </div>
      {treeEnabled &&
        row.getIsExpanded() &&
        row.subRows?.map(subRow => (
          <SortableRow
            key={subRow.id}
            row={subRow}
            gridTemplateColumns={gridTemplateColumns}
            columns={columns}
            reorderEnabled={reorderEnabled}
            treeEnabled={treeEnabled}
            isSelected={false}
            isClickable={isClickable}
            depth={depth + 1}
            onRowClick={onRowClick}
          />
        ))}
    </>
  );
};

const DataTable = <T extends { rowId: string }>({
  columns,
  data,
  emptyState,
  footer,
  sort,
  onSort,
  onRowClick,
  selectedRowId,
  selection,
  reorder,
  tree,
  minWidthRem,
}: DataTableProps<T>) => {
  const [internalData, setInternalData] = useState(data);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setInternalData(data);
  }, [data]);

  const selectionColumn = useMemo<ColumnDef<T>>(
    () => ({
      id: '_select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className={checkboxInputClassName}
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => {
        const disabled = selection?.disableRow?.(row.original);
        return (
          <input
            type="checkbox"
            className={checkboxInputClassName}
            checked={row.getIsSelected()}
            disabled={Boolean(disabled)}
            onChange={row.getToggleSelectedHandler()}
          />
        );
      },
      size: 40,
      enableSorting: false,
    }),
    [selection]
  );

  const tanstackColumns = useMemo<ColumnDef<T>[]>(() => {
    const cols = columns.map<ColumnDef<T>>(col => ({
      id: col.id,
      accessorKey: col.sortKey ?? col.id,
      header: () => col.header,
      cell: ({ row }) => col.cell(row.original, row.index),
      enableSorting: Boolean(col.sortKey),
    }));
    return selection ? [selectionColumn, ...cols] : cols;
  }, [columns, selection, selectionColumn]);

  const table = useReactTable({
    data: internalData,
    columns: tanstackColumns,
    state: { sorting, rowSelection, expanded },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: tree ? row => tree.getSubRows(row) ?? undefined : undefined,
    getRowId: row => row.rowId,
    enableRowSelection: selection ? row => !selection.disableRow?.(row.original) : false,
    manualSorting: Boolean(onSort),
  });

  useEffect(() => {
    if (!selection) return;
    const ids = new Set(Object.keys(rowSelection).filter(id => rowSelection[id]));
    selection.onChange(ids);
  }, [rowSelection]);

  useEffect(() => {
    if (!onSort || !sorting.length) return;
    onSort(sorting[0].id);
  }, [sorting]);

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setInternalData(prev => {
        const oldIndex = prev.findIndex(r => r.rowId === active.id);
        const newIndex = prev.findIndex(r => r.rowId === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        reorder?.onReorder(next);
        return next;
      });
    },
    [reorder]
  );

  const reorderEnabled = Boolean(reorder);
  const treeEnabled = Boolean(tree);
  const isClickable = Boolean(onRowClick);

  const gridTemplateColumns = [
    reorderEnabled ? '2rem' : null,
    treeEnabled ? '1.75rem' : null,
    selection ? '2.5rem' : null,
    ...columns.map(c => c.width ?? '1fr'),
  ]
    .filter(Boolean)
    .join(' ');

  const scrolls = minWidthRem !== undefined;

  const rows = table.getRowModel().rows.filter(r => r.depth === 0);

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div
        className={`bg-paper ${scrolls ? 'overflow-x-auto' : 'overflow-hidden'}`}
        style={{ boxShadow: CARD_SHADOW, borderRadius: CARD_RADIUS }}
      >
        <div style={scrolls ? { minWidth: `${minWidthRem}rem` } : undefined}>
          {/* Header strip */}
          <div
            className="grid items-center gap-3 px-4 h-10 text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider shrink-0"
            style={{
              gridTemplateColumns,
              backgroundColor: 'var(--color-theme-surface-warm, var(--color-theme-bg-warm))',
              borderBottom: `1px solid ${BORDER_COLOR}`,
            }}
          >
            {reorderEnabled && <span />}
            {treeEnabled && <span />}
            {selection && (
              <div className="flex items-center">
                {flexRender(
                  table.getHeaderGroups()[0].headers[0].column.columnDef.header,
                  table.getHeaderGroups()[0].headers[0].getContext()
                )}
              </div>
            )}
            {columns.map(col => {
              const sortable = Boolean(col.sortKey && onSort);
              const active = sortable && sort?.key === col.sortKey;
              return (
                <div
                  key={col.id}
                  className={`flex items-center min-w-0 ${alignClass[col.align ?? 'left']}`}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort!(col.sortKey!)}
                      className={`group/sort inline-flex items-center gap-1 min-w-0 uppercase tracking-wider cursor-pointer transition-colors ${active ? 'text-ink-secondary' : 'hover:text-ink-secondary'}`}
                    >
                      <span className="truncate">{col.header}</span>
                      <SortIcon sortKey={col.sortKey!} sort={sort} />
                    </button>
                  ) : (
                    <span className="truncate">{col.header}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {rows.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-ink-muted">
                {emptyState ?? <Translate>Nothing here yet.</Translate>}
              </div>
            ) : (
              rows.map(row => (
                <SortableRow
                  key={row.id}
                  row={row}
                  gridTemplateColumns={gridTemplateColumns}
                  columns={columns}
                  reorderEnabled={reorderEnabled}
                  treeEnabled={treeEnabled}
                  isSelected={
                    selectedRowId != null
                      ? row.original.rowId === selectedRowId
                      : row.getIsSelected()
                  }
                  isClickable={isClickable}
                  depth={0}
                  onRowClick={onRowClick}
                />
              ))
            )}
          </SortableContext>

          {/* Footer */}
          {footer !== undefined && (
            <div
              className="flex items-center justify-between px-4 h-10 text-xs text-ink-muted"
              style={{
                backgroundColor: 'var(--color-theme-surface-warm, var(--color-theme-bg-warm))',
                borderTop: `1px solid ${BORDER_COLOR}`,
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
};

export { DataTable };
export type { DataTableProps, DataTableColumn };
