import React from 'react';
import {
  DocumentIcon,
  DocumentTextIcon,
  LinkIcon,
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import type { EntityFileRow } from './types.js';

const iconClass = 'h-3.5 w-3.5 shrink-0 text-ink-muted';

const getRowIcon = (row: EntityFileRow) => {
  const mime = row.raw.mimetype || '';

  if (row.fileType === 'externalURL' || row.raw.url?.startsWith('http')) {
    return <LinkIcon className={iconClass} />;
  }

  if (mime.startsWith('audio/')) {
    return <MusicalNoteIcon className={iconClass} />;
  }

  if (mime.startsWith('video/')) {
    return <VideoCameraIcon className={iconClass} />;
  }

  if (mime.startsWith('image/')) {
    return <PhotoIcon className={iconClass} />;
  }

  if (
    mime === 'application/pdf' ||
    row.fileType === 'mainDocument' ||
    row.fileType === 'document'
  ) {
    return <DocumentTextIcon className={iconClass} />;
  }

  return <DocumentIcon className={iconClass} />;
};

export { getRowIcon };
