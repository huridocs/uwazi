import React from 'react';
import { LinkIcon, MusicalNoteIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { FileIcon } from '#V2/Components/UI/index.js';
import type { MediaPickerMode } from './mediaPickerAttachments.js';

const iconClass = 'h-8 w-8 text-ink-muted';

const MediaPickerAttachmentPreview = ({
  mode,
  filename,
  mimetype,
  url,
}: {
  mode: MediaPickerMode;
  filename: string;
  mimetype: string;
  url?: string;
}) => {
  if (mode === 'image') {
    return (
      <FileIcon filename={filename} mimetype={mimetype} altText="" className="h-full w-full" />
    );
  }
  if (url) return <LinkIcon className={iconClass} aria-hidden />;
  if (mimetype.includes('audio')) return <MusicalNoteIcon className={iconClass} aria-hidden />;
  return <VideoCameraIcon className={iconClass} aria-hidden />;
};

export { MediaPickerAttachmentPreview };
