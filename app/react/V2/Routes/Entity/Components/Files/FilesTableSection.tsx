import React, { useCallback, useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';
import { DataTable } from '#V2/Components/UI/index.js';
import { EntityFileRow } from './types.js';
import { filesDataTableColumns } from './filesTableColumns.js';

type FilesTableSectionProps = {
  title: string;
  rows: EntityFileRow[];
  selectedRowIds: string[];
  focusedRowId?: string;
  onSelectRows: (ids: string[]) => void;
  onFocusRow: (row: EntityFileRow) => void;
};

const FilesTableSection = ({
  title,
  rows,
  selectedRowIds,
  focusedRowId,
  onSelectRows,
  onFocusRow,
}: FilesTableSectionProps) => {
  const rowIdsInSection = useMemo(() => new Set(rows.map(row => row.rowId)), [rows]);

  const selectedIds = useMemo(
    () => new Set(selectedRowIds.filter(id => rowIdsInSection.has(id))),
    [rowIdsInSection, selectedRowIds]
  );

  const allSelected = rows.length > 0 && rows.every(row => selectedIds.has(row.rowId));

  const onToggleRow = useCallback(
    (rowId: string) => {
      const next = selectedRowIds.includes(rowId)
        ? selectedRowIds.filter(id => id !== rowId)
        : [...selectedRowIds, rowId];
      onSelectRows(next);
    },
    [onSelectRows, selectedRowIds]
  );

  const onToggleAll = useCallback(() => {
    if (allSelected) {
      onSelectRows(selectedRowIds.filter(id => !rowIdsInSection.has(id)));
      return;
    }
    onSelectRows([...new Set([...selectedRowIds, ...rows.map(row => row.rowId)])]);
  }, [allSelected, onSelectRows, rowIdsInSection, rows, selectedRowIds]);

  const columns = useMemo(
    () =>
      filesDataTableColumns({
        selectedIds,
        allSelected,
        onToggleRow,
        onToggleAll,
      }),
    [allSelected, onToggleAll, onToggleRow, selectedIds]
  );

  return (
    <section className="flex flex-col gap-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
        <Translate>{title}</Translate>
      </p>
      <DataTable
        columns={columns}
        data={rows}
        selectedRowId={focusedRowId ?? null}
        onRowClick={onFocusRow}
        emptyState={<Translate>No files available</Translate>}
        footer={<span>{rows.length}</span>}
        minWidthRem={42}
      />
    </section>
  );
};

export { FilesTableSection };
