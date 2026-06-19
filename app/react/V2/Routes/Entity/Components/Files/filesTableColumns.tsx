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
    return <LinkIcon className="h-5 w-5 shrink-0" />;
  }

  if (mime.startsWith('audio/')) {
    return <MusicalNoteIcon className="h-5 w-5 shrink-0" />;
  }

  if (mime.startsWith('video/')) {
    return <VideoCameraIcon className="h-5 w-5 shrink-0" />;
  }

  if (mime.startsWith('image/')) {
    return <PhotoIcon className="h-5 w-5 shrink-0" />;
  }

  if (
    mime === 'application/pdf' ||
    row.fileType === 'mainDocument' ||
    row.fileType === 'document'
  ) {
    return <DocumentTextIcon className="h-5 w-5 shrink-0" />;
  }

  return <DocumentIcon className="h-5 w-5 shrink-0" />;
};

const cellClassName = 'text-xs text-ink-tertiary';

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
          <span className={`truncate ${cellClassName}`}>{current.displayName}</span>
        </button>
      );
    },
    meta: {
      headerClassName: 'w-2/5 !p-2 text-[11px] text-ink-tertiary font-semibold',
      contentClassName: cellClassName,
    },
  }),
  columnHelper.accessor('typeLabel', {
    header: 'TYPE',
    meta: {
      headerClassName: 'w-0 !p-2 text-[11px] text-ink-tertiary font-semibold',
      contentClassName: cellClassName,
    },
  }),
  columnHelper.accessor('sizeLabel', {
    header: 'SIZE',
    meta: {
      headerClassName: 'w-0 !p-2 text-[11px] text-ink-tertiary font-semibold',
      contentClassName: cellClassName,
    },
  }),
  columnHelper.accessor('languageKey', {
    header: 'LANG',
    meta: {
      headerClassName: 'w-0 !p-2 text-[11px] text-ink-tertiary font-semibold',
      contentClassName: cellClassName,
    },
  }),
  columnHelper.accessor('modifiedLabel', {
    header: 'MODIFIED',
    meta: {
      headerClassName: 'w-0 !p-2 text-[11px] text-ink-tertiary font-semibold',
      contentClassName: cellClassName,
    },
  }),
];

export { filesTableColumns };
