/* eslint-disable max-lines */
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
import { Translate } from 'app/I18N';
import { DraggableRow, RowDragHandleCell, DnDHeader } from './DnDComponents';
import { IndeterminateCheckboxHeader, IndeterminateCheckboxRow } from './RowSelectComponents';
import { dndSortHandler, getRowIds } from './helpers';
import { SortingChevrons } from './SortingChevrons';
import { GroupCell, GroupHeader } from './GroupComponents';
import { NoDataRow } from './NoDataRow';
import { DefaultNoDataMessage } from './DefaultNoDataMessage';
import { Button } from '../Button';

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
  groupColumnPosition?: number;
  manualSorting?: boolean;
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
  noDataMessage = <DefaultNoDataMessage />,
  groupColumnPosition = 0,
  initialSelection = [],
  manualSorting,
}: TableProps<T>) => {
  const [dataState, setDataState] = useState(data);
  const initialRowSelection = useMemo(
    () => initialSelection.reduce((acc, item) => ({ ...acc, [item.rowId]: true }), {}),
    [initialSelection]
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialRowSelection);
  const [sorting, setSorting] = useState<SortingState>(defaultSorting || []);

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
    return { memoizedColumns: tableColumns, groupColumnIndex: calculatedIndex };
  }, [columns, data, enableSelections, dnd]);

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
    setRowSelection(initialRowSelection);
  }, [data]);

  useEffect(() => {
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
      <div className="w-full overflow-auto rounded-md shadow">
        <div data-testid="table-header" className="flex justify-between items-center p-4 gap-4">
          {header && <div className="flex-grow">{header}</div>}
          <div className="flex gap-2">
            {hasGroups && (
              <>
                <Button disabled={!canCollapse} styling="light" onClick={collapseAll}>
                  <Translate>Collapse all</Translate>
                </Button>
                <Button disabled={!canExpand} styling="light" onClick={expandAll}>
                  <Translate>Expand all</Translate>
                </Button>
              </>
            )}
            {actions}
          </div>
        </div>
        <table className={`w-full ${className || ''}`}>
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
                      className={`p-4 text-sm text-gray-500 uppercase border-b ${customClassName || ''}`}
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
                  />
                ))}
              </SortableContext>
            )}
          </tbody>
        </table>
        {footer && dataState.length > 0 && <div className="p-4">{footer}</div>}
      </div>
    </DndContext>
  );
};

export type { TableProps, TableRow };
export { Table };
