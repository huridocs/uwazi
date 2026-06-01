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
import { Pill } from '#V2/Components/UI/index.js';
import { EntityFileRow } from './types.js';
import { FilesRowActionsMenu } from './FilesRowActionsMenu.js';

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

const filesTableColumns = ({
  onFocus,
  onEdit,
  onDelete,
}: {
  onFocus: (row: EntityFileRow) => void;
  onEdit: (row: EntityFileRow) => void;
  onDelete: (row: EntityFileRow) => void;
}) => [
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
          <span className="truncate text-ink">{current.displayName}</span>
          {current.isActiveMain ? <Pill color="gray">Active</Pill> : null}
        </button>
      );
    },
    meta: { headerClassName: 'w-2/5 !p-2 !text-xs' },
  }),
  columnHelper.accessor('typeLabel', {
    header: 'TYPE',
    meta: { headerClassName: 'w-0 !p-2 !text-xs' },
  }),
  columnHelper.accessor('sizeLabel', {
    header: 'SIZE',
    meta: { headerClassName: 'w-0 !p-2 !text-xs' },
  }),
  columnHelper.accessor('languageKey', {
    header: 'LANG',
    cell: ({ getValue }) => <Pill color="gray">{getValue()}</Pill>,
    meta: { headerClassName: 'w-0 !p-2 !text-xs' },
  }),
  columnHelper.accessor('modifiedLabel', {
    header: 'MODIFIED',
    meta: { headerClassName: 'w-0 !p-2 !text-xs' },
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <FilesRowActionsMenu
          row={row.original}
          onView={onFocus}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddTranslation={onFocus}
        />
      </div>
    ),
    enableSorting: false,
    meta: { headerClassName: 'w-0 !p-2 !text-xs', contentClassName: 'text-right' },
  }),
];

export { filesTableColumns };
