import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  DocumentIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  PhotoIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { EntityFileRow } from './types.js';

const columnHelper = createColumnHelper<EntityFileRow>();

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

const cellClassName = 'text-xs text-ink-tertiary whitespace-nowrap';

const nameClassName = 'truncate text-xs font-medium text-ink';

const headerClassName = 'w-0 !px-4 !py-2 !text-micro text-ink-tertiary font-semibold';

const filesTableColumns = ({ onFocus }: { onFocus: (row: EntityFileRow) => void }) => [
  columnHelper.accessor('displayName', {
    header: 'FILE NAME',
    cell: ({ row }) => {
      const current = row.original;
      return (
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded text-left"
          onClick={() => onFocus(current)}
        >
          {getRowIcon(current)}
          <span className={nameClassName}>{current.displayName}</span>
        </button>
      );
    },
    meta: {
      headerClassName: 'w-2/5 !px-4 !py-2 !text-micro text-ink-tertiary font-semibold',
      contentClassName: cellClassName,
    },
  }),
  columnHelper.accessor('typeLabel', {
    header: 'TYPE',
    meta: {
      headerClassName,
      contentClassName: cellClassName,
    },
  }),
  columnHelper.accessor('sizeLabel', {
    header: 'SIZE',
    meta: {
      headerClassName,
      contentClassName: cellClassName,
    },
  }),
  columnHelper.accessor('languageKey', {
    header: 'LANG',
    meta: {
      headerClassName,
      contentClassName: cellClassName,
    },
  }),
  columnHelper.accessor('modifiedLabel', {
    header: 'MODIFIED',
    meta: {
      headerClassName,
      contentClassName: cellClassName,
    },
  }),
];

export { filesTableColumns };
export { getRowIcon };
