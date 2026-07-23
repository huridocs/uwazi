import React from 'react';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';
import type { DataTableColumn } from '#V2/Components/UI/DataTable/types.js';
import { fileSupportsLanguage } from './fileHelpers.js';
import { getRowIcon } from './fileRowIcon.js';
import { FileProcessStatusIndicator } from './FileProcessStatusIndicator.js';
import { FileRowKebab } from './FileRowKebab.js';
import { EntityFileRow } from './types.js';
import Translate from '#shared/translate.js';

type FilesTableColumnsParams = {
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleRow: (rowId: string) => void;
  onToggleAll: () => void;
  onViewRow: (row: EntityFileRow) => void;
  onRenameRow: (row: EntityFileRow) => void;
  onChangeLanguageRow: (row: EntityFileRow) => void;
  onDeleteRow: (row: EntityFileRow) => void;
};

const stopRowClick = (event: React.MouseEvent) => {
  event.stopPropagation();
};

const filesDataTableColumns = ({
  selectedIds,
  allSelected,
  onToggleRow,
  onToggleAll,
  onViewRow,
  onRenameRow,
  onChangeLanguageRow,
  onDeleteRow,
}: FilesTableColumnsParams): DataTableColumn<EntityFileRow>[] => [
  {
    id: 'select',
    width: '2rem',
    align: 'center',
    header: (
      <label className="flex items-center justify-center">
        <input
          type="checkbox"
          className={checkboxInputClassName}
          checked={allSelected}
          onChange={onToggleAll}
          onClick={stopRowClick}
          aria-label="Select all files"
        />
      </label>
    ),
    cell: row => (
      <label className="flex items-center justify-center">
        <input
          type="checkbox"
          className={checkboxInputClassName}
          checked={selectedIds.has(row.rowId)}
          onChange={() => onToggleRow(row.rowId)}
          onClick={stopRowClick}
          disabled={row.status === 'processing'}
          aria-label={`Select ${row.displayName}`}
        />
      </label>
    ),
  },
  {
    id: 'displayName',
    header: 'File name',
    width: '2fr',
    cell: row => (
      <div
        className={`flex min-w-0 items-center gap-2 ${
          row.status === 'processing' ? 'opacity-60' : ''
        }`}
      >
        <span className="shrink-0">{getRowIcon(row)}</span>
        <span className="truncate text-xs font-medium text-ink">{row.displayName}</span>
        <FileProcessStatusIndicator status={row.status} />
      </div>
    ),
  },
  {
    id: 'typeLabel',
    header: 'Type',
    width: '4.5rem',
    cell: row => <span className="text-xs text-ink-tertiary">{row.typeLabel}</span>,
  },
  {
    id: 'sizeLabel',
    header: 'Size',
    width: '4.5rem',
    cell: row => (
      <span dir="ltr" className="text-xs text-ink-tertiary">
        {row.sizeLabel}
      </span>
    ),
  },
  {
    id: 'languageKey',
    header: 'Lang',
    width: '3.5rem',
    cell: row => <span className="text-xs text-ink-tertiary">{row.languageKey}</span>,
  },
  {
    id: 'modifiedLabel',
    header: 'Modified',
    width: '5.5rem',
    cell: row => <span className="text-xs text-ink-tertiary">{row.modifiedLabel}</span>,
  },
  {
    id: 'actions',
    header: <Translate className="sr-only">Actions</Translate>,
    width: '2rem',
    align: 'right',
    cell: row => (
      <div className="flex items-center justify-end" onClick={stopRowClick}>
        <FileRowKebab
          row={row}
          onView={onViewRow}
          onRename={onRenameRow}
          onChangeLanguage={onChangeLanguageRow}
          onDelete={onDeleteRow}
          showLanguageAction={fileSupportsLanguage({
            type: row.raw.mimetype || '',
            name: row.raw.originalname || row.displayName,
          })}
          disableMutations={row.status === 'processing'}
        />
      </div>
    ),
  },
];

export { filesDataTableColumns };
