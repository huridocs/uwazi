import React, { useCallback, useMemo } from 'react';
import { Translate, t } from '#app/I18N/index.js';
import { DataTable } from '#V2/Components/UI/index.js';
import { isFileRowSelectable } from './fileHelpers.js';
import { EntityFileRow } from './types.js';
import { filesDataTableColumns } from './filesTableColumns.js';

type FilesTableSectionProps = {
  title: string;
  rows: EntityFileRow[];
  selectedRowIds: string[];
  focusedRowId?: string;
  onSelectRows: (ids: string[]) => void;
  onFocusRow: (row: EntityFileRow) => void;
  onViewRow: (row: EntityFileRow) => void;
  onRenameRow: (row: EntityFileRow) => void;
  onChangeLanguageRow: (row: EntityFileRow) => void;
  onDeleteRow: (row: EntityFileRow) => void;
};

const FilesTableSection = ({
  title,
  rows,
  selectedRowIds,
  focusedRowId,
  onSelectRows,
  onFocusRow,
  onViewRow,
  onRenameRow,
  onChangeLanguageRow,
  onDeleteRow,
}: FilesTableSectionProps) => {
  const rowIdsInSection = useMemo(() => new Set(rows.map(row => row.rowId)), [rows]);

  const selectedIds = useMemo(
    () => new Set(selectedRowIds.filter(id => rowIdsInSection.has(id))),
    [rowIdsInSection, selectedRowIds]
  );

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
    const selectableIds = rows.filter(isFileRowSelectable).map(row => row.rowId);
    const allSelectableSelected =
      selectableIds.length > 0 && selectableIds.every(id => selectedIds.has(id));

    if (allSelectableSelected) {
      onSelectRows(selectedRowIds.filter(id => !rowIdsInSection.has(id)));
      return;
    }
    onSelectRows([...new Set([...selectedRowIds, ...selectableIds])]);
  }, [onSelectRows, rowIdsInSection, rows, selectedIds, selectedRowIds]);

  const selectableRows = useMemo(() => rows.filter(isFileRowSelectable), [rows]);
  const allSelected =
    selectableRows.length > 0 && selectableRows.every(row => selectedIds.has(row.rowId));

  const columns = useMemo(
    () =>
      filesDataTableColumns({
        selectedIds,
        allSelected,
        onToggleRow,
        onToggleAll,
        onViewRow,
        onRenameRow,
        onChangeLanguageRow,
        onDeleteRow,
      }),
    [
      allSelected,
      onChangeLanguageRow,
      onDeleteRow,
      onRenameRow,
      onToggleAll,
      onToggleRow,
      onViewRow,
      selectedIds,
    ]
  );

  const footerLabel =
    rows.length === 1
      ? `${rows.length} ${t('System', 'file', null, false)}`
      : `${rows.length} ${t('System', 'files', null, false)}`;

  return (
    <section className="flex flex-col">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
        <Translate>{title}</Translate>
      </p>
      <DataTable
        columns={columns}
        data={rows}
        selectedRowId={focusedRowId ?? null}
        onRowClick={onFocusRow}
        emptyState={<Translate>No files available</Translate>}
        footer={<span>{footerLabel}</span>}
        minWidthRem={44}
      />
    </section>
  );
};

export { FilesTableSection };
