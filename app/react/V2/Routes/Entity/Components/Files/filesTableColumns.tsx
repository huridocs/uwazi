import React from 'react';
import {
  DocumentIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  PhotoIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';
import type { DataTableColumn } from '#V2/Components/UI/DataTable/types.js';
import { EntityFileRow } from './types.js';

const getRowIcon = (row: EntityFileRow) => {
  const mime = row.raw.mimetype || '';

  if (row.fileType === 'externalURL' || row.raw.url?.startsWith('http')) {
    return <LinkIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" />;
  }

  if (mime.startsWith('audio/')) {
    return <MusicalNoteIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" />;
  }

  if (mime.startsWith('video/')) {
    return <VideoCameraIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" />;
  }

  if (mime.startsWith('image/')) {
    return <PhotoIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" />;
  }

  if (
    mime === 'application/pdf' ||
    row.fileType === 'mainDocument' ||
    row.fileType === 'document'
  ) {
    return <DocumentTextIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" />;
  }

  return <DocumentIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" />;
};

type FilesTableColumnsParams = {
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleRow: (rowId: string) => void;
  onToggleAll: () => void;
};

const stopRowClick = (event: React.MouseEvent) => {
  event.stopPropagation();
};

const filesDataTableColumns = ({
  selectedIds,
  allSelected,
  onToggleRow,
  onToggleAll,
}: FilesTableColumnsParams): DataTableColumn<EntityFileRow>[] => [
  {
    id: 'select',
    width: '2rem',
    align: 'center',
    header: (
      <label className="flex items-center justify-center" onClick={stopRowClick}>
        <input
          type="checkbox"
          className={checkboxInputClassName}
          checked={allSelected}
          onChange={onToggleAll}
          aria-label="Select all files"
        />
      </label>
    ),
    cell: row => (
      <label className="flex items-center justify-center" onClick={stopRowClick}>
        <input
          type="checkbox"
          className={checkboxInputClassName}
          checked={selectedIds.has(row.rowId)}
          onChange={() => onToggleRow(row.rowId)}
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
      <div className="flex min-w-0 items-center gap-2">
        {getRowIcon(row)}
        <span className="truncate text-xs font-medium text-ink">{row.displayName}</span>
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
];

export { filesDataTableColumns, getRowIcon };
