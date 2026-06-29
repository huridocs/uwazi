import React, { useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';
import { Table } from '#V2/Components/UI/index.js';
import { EntityFileRow } from './types.js';
import { filesTableColumns } from './filesTableColumns.js';

type FilesTableSectionProps = {
  sectionId: string;
  title: string;
  rows: EntityFileRow[];
  selectedRowIds: string[];
  focusedRowId?: string;
  onSelectRows: (ids: string[]) => void;
  onFocusRow: (row: EntityFileRow) => void;
};

const selectionMatches = (next: string[], current: string[]) =>
  next.length === current.length && next.every(id => current.includes(id));

const FilesTableSection = ({
  sectionId,
  title,
  rows,
  selectedRowIds,
  focusedRowId,
  onSelectRows,
  onFocusRow,
}: FilesTableSectionProps) => {
  const rowIdsInSection = useMemo(() => new Set(rows.map(row => row.rowId)), [rows]);

  const initialSelection = useMemo(
    () => rows.filter(row => selectedRowIds.includes(row.rowId)),
    [rows, selectedRowIds]
  );

  const columns = useMemo(() => filesTableColumns({ onFocus: onFocusRow }), [onFocusRow]);

  return (
    <section className="flex flex-col gap-2">
      <p className="px-1 text-micro font-semibold uppercase tracking-wide text-ink-tertiary">
        <Translate>{title}</Translate>
      </p>
      <Table
        className="text-xs text-ink-tertiary"
        columns={columns}
        data={rows}
        enableSelections
        initialSelection={initialSelection}
        selectAllCheckboxId={`files-select-all-${sectionId}`}
        onSelect={({ selectedRows }) => {
          const selectedInSection = Object.keys(selectedRows).filter(id => selectedRows[id]);
          const selectedInOtherSections = selectedRowIds.filter(id => !rowIdsInSection.has(id));
          const merged = [...selectedInOtherSections, ...selectedInSection];
          if (!selectionMatches(merged, selectedRowIds)) {
            onSelectRows(merged);
          }
        }}
        noDataMessage={<Translate>No files available</Translate>}
        containerClassName="rounded-md border border-border-soft"
        focusedRowId={focusedRowId}
        focusedRowClassName="bg-parchment"
      />
    </section>
  );
};

export { FilesTableSection };
