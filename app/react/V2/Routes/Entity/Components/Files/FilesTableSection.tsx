import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Table } from '#V2/Components/UI/index.js';
import { EntityFileRow } from './types.js';
import { filesTableColumns } from './filesTableColumns.js';

type FilesTableSectionProps = {
  title: string;
  rows: EntityFileRow[];
  selectedRowIds: string[];
  focusedRowId?: string;
  onSelectRows: (ids: string[]) => void;
  onFocusRow: (row: EntityFileRow) => void;
  onEditRow: (row: EntityFileRow) => void;
  onDeleteRow: (row: EntityFileRow) => void;
};

const FilesTableSection = ({
  title,
  rows,
  selectedRowIds,
  focusedRowId,
  onSelectRows,
  onFocusRow,
  onEditRow,
  onDeleteRow,
}: FilesTableSectionProps) => (
  <section className="flex flex-col gap-2">
    <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
      <Translate>{title}</Translate>
    </h3>
    <Table
      className="text-xs text-ink-tertiary"
      columns={filesTableColumns({
        onFocus: onFocusRow,
        onEdit: onEditRow,
        onDelete: onDeleteRow,
      })}
      data={rows}
      enableSelections
      initialSelection={rows.filter(row => selectedRowIds.includes(row.rowId))}
      onSelect={({ selectedRows }) => {
        const ids = Object.keys(selectedRows);
        onSelectRows(ids);
      }}
      noDataMessage={<Translate>No files available</Translate>}
      containerClassName="rounded-md border border-border-soft"
      focusedRowId={focusedRowId}
    />
  </section>
);

export { FilesTableSection };
