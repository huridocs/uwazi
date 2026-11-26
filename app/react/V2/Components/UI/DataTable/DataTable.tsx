/* eslint-disable react/no-multi-comp */
/* eslint-disable max-lines */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  type CellContext,
  type ColumnDef,
  type HeaderContext,
  type Row,
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
import { RenderIfVisible } from '../RenderIfVisible.js';
import type {
  DataTableColumn,
  DataTableDensity,
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
  'group grid gap-3 items-center text-sm px-4 transition-colors focus:outline-hidden focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color-mix(in_srgb,var(--color-theme-text-primary)_20%,transparent)]';

const ROW_DENSITY: Record<DataTableDensity, string> = {
  comfortable: 'min-h-11 py-2',
  compact: 'min-h-8 py-1',
};

const TABLE_EAGER_COUNT = 40;
const TABLE_VISIBLE_OFFSET = 600;
const TABLE_ROW_HEIGHT: Record<DataTableDensity, number> = {
  comfortable: 44,
  compact: 36,
};

const tableScrollClass = (stickyHeader: boolean | undefined, scrolls: boolean) => {
  if (stickyHeader) return 'h-full overflow-auto';
  if (scrolls) return 'overflow-x-auto';
  return 'overflow-hidden';
};

interface DataTableProps<T extends { rowId: string }> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyState?: React.ReactNode;
  footer?: React.ReactNode;
  sort?: DataTableSort;
  onSort?: (key: string) => void;
  onRowClick?: (row: T, event: React.MouseEvent<HTMLElement>) => void;
  rowSelectId?: (row: T) => string | undefined;
  selectedRowId?: string | null;
  selectedRowIds?: readonly string[];
  selection?: DataTableSelection<T>;
  reorder?: DataTableReorder<T>;
  tree?: DataTableTree<T>;
  density?: DataTableDensity;
  /** Applies extra px offset for minimum-width scroll containment */
  minWidthRem?: number;
  /** Mounts only the rows near the viewport. Ignored while reordering or tree rows are on. */
  virtualize?: boolean;
  stickyHeader?: boolean;
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

const DataTableSelectionHeader = <T extends { rowId: string }>({
  table,
}: HeaderContext<T, unknown>) => (
  <input
    type="checkbox"
    className={checkboxInputClassName}
    checked={table.getIsAllRowsSelected()}
    onChange={table.getToggleAllRowsSelectedHandler()}
  />
);

const DataTableSelectionCell = <T extends { rowId: string }>({
  row,
  disableRow,
}: {
  row: Row<T>;
  disableRow?: (row: T) => boolean | string;
}) => {
  const disabled = Boolean(disableRow?.(row.original));
  return (
    <input
      type="checkbox"
      className={checkboxInputClassName}
      checked={row.getIsSelected()}
      disabled={disabled}
      onChange={row.getToggleSelectedHandler()}
    />
  );
};

const createSelectionColumn = <T extends { rowId: string }>(
  disableRow?: (row: T) => boolean | string
): ColumnDef<T> => ({
  id: '_select',
  header: DataTableSelectionHeader,
  cell: (props: CellContext<T, unknown>) => (
    <DataTableSelectionCell row={props.row} disableRow={disableRow} />
  ),
  size: 40,
  enableSorting: false,
});

const SortableRow = <T extends { rowId: string }>({
  row,
  gridTemplateColumns,
  columns,
  reorderEnabled,
  treeEnabled,
  isSelected,
  isClickable,
  density,
  depth,
  onRowClick,
  rowSelectId,
}: {
  row: import('@tanstack/react-table').Row<T>;
  gridTemplateColumns: string;
  columns: DataTableColumn<T>[];
  reorderEnabled: boolean;
  treeEnabled: boolean;
  isSelected: boolean;
  isClickable: boolean;
  density: DataTableDensity;
  depth: number;
  onRowClick?: (row: T, event: React.MouseEvent<HTMLElement>) => void;
  rowSelectId?: (row: T) => string | undefined;
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

  const rowInteractionProps = isClickable
    ? {
        onClick: (event: React.MouseEvent<HTMLElement>) => onRowClick?.(row.original, event),
      }
    : {};

  return (
    <>
      <div
        ref={setNodeRef}
        data-select-id={rowSelectId?.(row.original)}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rowInteractionProps}
        className={`${ROW_BASE} ${ROW_DENSITY[density]} ${isClickable ? 'cursor-pointer' : ''} ${
          isSelected ? 'bg-parchment [&_.text-ink-tertiary]:text-ink-secondary' : 'hover:bg-warm'
        }`}
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
            className={`flex min-w-0 items-center overflow-visible text-ink ${alignClass[col.align ?? 'left']}`}
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
            density={density}
            depth={depth + 1}
            onRowClick={onRowClick}
            rowSelectId={rowSelectId}
          />
        ))}
    </>
  );
};

const columnDef = <T extends { rowId: string }>(column: DataTableColumn<T>): ColumnDef<T> => ({
  id: column.id,
  accessorKey: column.sortKey ?? column.id,
  header: () => <>{column.header}</>,
  cell: ({ row }) => <>{column.cell(row.original, row.index)}</>,
  enableSorting: Boolean(column.sortKey),
});

const useTableState = <T extends { rowId: string }>(props: DataTableProps<T>) => {
  const { data, onSort, selection } = props;
  const [internalData, setInternalData] = useState(data);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setInternalData(data);
  }, [data]);

  useEffect(() => {
    if (!onSort || !sorting.length) return;
    onSort(sorting[0].id);
  }, [sorting, onSort]);

  useEffect(() => {
    if (!selection) return;
    const ids = new Set(Object.keys(rowSelection).filter(id => rowSelection[id]));
    selection.onChange(ids);
  }, [rowSelection, selection]);

  return {
    internalData,
    setInternalData,
    sorting,
    setSorting,
    rowSelection,
    setRowSelection,
    expanded,
    setExpanded,
  };
};

const useRowDrag = <T extends { rowId: string }>(
  reorder: DataTableReorder<T> | undefined,
  setRows: (update: (rows: T[]) => T[]) => void
) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setRows(prev => {
        const oldIndex = prev.findIndex(row => row.rowId === active.id);
        const newIndex = prev.findIndex(row => row.rowId === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        reorder?.onReorder(next);
        return next;
      });
    },
    [reorder, setRows]
  );
  return { sensors, handleDragEnd };
};

const tableLayout = <T extends { rowId: string }>(props: DataTableProps<T>) => {
  const reorderEnabled = Boolean(props.reorder);
  const treeEnabled = Boolean(props.tree);
  const hasSelection = Boolean(props.selection);
  const gridTemplateColumns = [
    reorderEnabled ? '2rem' : null,
    treeEnabled ? '1.75rem' : null,
    hasSelection ? '2.5rem' : null,
    ...props.columns.map(column => column.width ?? '1fr'),
  ]
    .filter(Boolean)
    .join(' ');
  return {
    reorderEnabled,
    treeEnabled,
    deferOffscreen: Boolean(props.virtualize) && !reorderEnabled && !treeEnabled,
    isClickable: Boolean(props.onRowClick),
    gridTemplateColumns,
    scrolls: props.minWidthRem !== undefined,
  };
};

const useDataTableView = <T extends { rowId: string }>(props: DataTableProps<T>) => {
  const state = useTableState(props);
  const { selection, tree, onSort } = props;
  const selectionColumn = useMemo(
    () => createSelectionColumn<T>(selection?.disableRow),
    [selection]
  );
  const columns = useMemo(() => {
    const defs = props.columns.map(column => columnDef(column));
    return selection ? [selectionColumn, ...defs] : defs;
  }, [props.columns, selection, selectionColumn]);
  const table = useReactTable({
    data: state.internalData,
    columns,
    state: {
      sorting: state.sorting,
      rowSelection: state.rowSelection,
      expanded: state.expanded,
    },
    onSortingChange: state.setSorting,
    onRowSelectionChange: state.setRowSelection,
    onExpandedChange: state.setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: tree ? row => tree.getSubRows(row) ?? undefined : undefined,
    getRowId: row => row.rowId,
    enableRowSelection: selection ? row => !selection.disableRow?.(row.original) : false,
    manualSorting: Boolean(onSort),
  });
  const drag = useRowDrag(props.reorder, state.setInternalData);
  return {
    ...props,
    density: props.density ?? 'comfortable',
    ...drag,
    ...tableLayout(props),
    table,
    rows: table.getRowModel().rows.filter(row => row.depth === 0),
  };
};

const rowIsSelected = ({
  rowId,
  tanstackSelected,
  selectedRowId,
  selectedRowIds,
}: {
  rowId: string;
  tanstackSelected: boolean;
  selectedRowId?: string | null;
  selectedRowIds?: readonly string[];
}) => {
  if (selectedRowIds) {
    return selectedRowIds.includes(rowId);
  }
  if (selectedRowId != null) {
    return rowId === selectedRowId;
  }
  return tanstackSelected;
};

const DataTable = <T extends { rowId: string }>(props: DataTableProps<T>) => {
  const {
    columns,
    emptyState,
    footer,
    sort,
    onSort,
    onRowClick,
    rowSelectId,
    selectedRowId,
    selectedRowIds,
    selection,
    density,
    minWidthRem,
    stickyHeader,
    table,
    sensors,
    handleDragEnd,
    reorderEnabled,
    treeEnabled,
    deferOffscreen,
    isClickable,
    gridTemplateColumns,
    scrolls,
    rows,
  } = useDataTableView(props);

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div
        className={`bg-paper ${tableScrollClass(stickyHeader, scrolls)}`}
        style={{ boxShadow: CARD_SHADOW, borderRadius: CARD_RADIUS }}
      >
        <div className="w-full" style={scrolls ? { minWidth: `${minWidthRem}rem` } : undefined}>
          {/* Header strip */}
          <div
            className={`grid items-center gap-3 px-4 h-10 text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider shrink-0 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}
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
              rows.map((row, index) => {
                const sortableRow = (
                  <SortableRow
                    row={row}
                    gridTemplateColumns={gridTemplateColumns}
                    columns={columns}
                    reorderEnabled={reorderEnabled}
                    treeEnabled={treeEnabled}
                    isSelected={rowIsSelected({
                      rowId: row.original.rowId,
                      tanstackSelected: row.getIsSelected(),
                      selectedRowId,
                      selectedRowIds,
                    })}
                    isClickable={isClickable}
                    density={density}
                    depth={0}
                    onRowClick={onRowClick}
                    rowSelectId={rowSelectId}
                  />
                );
                if (!deferOffscreen) {
                  return <React.Fragment key={row.id}>{sortableRow}</React.Fragment>;
                }
                return (
                  <RenderIfVisible
                    key={row.id}
                    defaultHeight={TABLE_ROW_HEIGHT[density]}
                    visibleOffset={TABLE_VISIBLE_OFFSET}
                    initialVisible={index < TABLE_EAGER_COUNT}
                  >
                    {sortableRow}
                  </RenderIfVisible>
                );
              })
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
