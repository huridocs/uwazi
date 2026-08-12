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

const defaultIconClass = 'h-3.5 w-3.5 shrink-0 text-ink-muted';
const browserFileIconClass = 'h-4 w-4 shrink-0 text-ink-muted';

type ExternalPlatform = 'youtube' | 'vimeo' | 'link';

type MimeIconInput = {
  mime?: string;
  name?: string;
  url?: string;
  fileType?: EntityFileRow['fileType'];
  className?: string;
};

const resolveExternalPlatform = (url: string): ExternalPlatform => {
  if (/(?:youtube\.com|youtu\.be)/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  return 'link';
};

const getExternalLinkIcon = (url: string, className: string) => {
  const platform = resolveExternalPlatform(url);
  if (platform === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.75 15.5v-7l6.5 3.5-6.5 3.5Z" />
      </svg>
    );
  }
  if (platform === 'vimeo') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
        <path d="M23.98 6.42c-.1 2.18-1.62 5.17-4.56 8.97-3.05 3.95-5.62 5.93-7.73 5.93-1.3 0-2.4-1.2-3.3-3.6L6.5 10.7c-.67-2.4-1.39-3.6-2.16-3.6-.17 0-.76.35-1.78 1.05L1.5 6.9c1.13-.99 2.24-1.98 3.33-2.97 1.5-1.3 2.62-1.98 3.37-2.05 1.77-.17 2.86 1.04 3.27 3.63.44 2.79.74 4.53.92 5.2.52 2.38 1.1 3.57 1.73 3.57.49 0 1.22-.77 2.2-2.32.97-1.54 1.49-2.72 1.56-3.52.13-1.33-.38-2-1.54-2-.55 0-1.11.12-1.69.37 1.12-3.68 3.27-5.46 6.44-5.34 2.35.08 3.46 1.59 3.32 4.55Z" />
      </svg>
    );
  }
  return <LinkIcon className={className} />;
};

const getMimeFileIcon = ({
  mime = '',
  name = '',
  url = '',
  fileType,
  className = defaultIconClass,
}: MimeIconInput) => {
  if (fileType === 'externalURL' || url.startsWith('http')) {
    return getExternalLinkIcon(url, className);
  }

  if (mime.startsWith('audio/')) {
    return <MusicalNoteIcon className={className} />;
  }

  if (mime.startsWith('video/')) {
    return <VideoCameraIcon className={className} />;
  }

  if (mime.startsWith('image/')) {
    return <PhotoIcon className={className} />;
  }

  if (
    mime === 'application/pdf' ||
    name.toLowerCase().endsWith('.pdf') ||
    fileType === 'mainDocument' ||
    fileType === 'document'
  ) {
    return <DocumentTextIcon className={className} />;
  }

  return <DocumentIcon className={className} />;
};

const getRowIcon = (row: EntityFileRow) =>
  getMimeFileIcon({
    mime: row.raw.mimetype,
    name: row.raw.originalname || row.displayName,
    url: row.raw.url,
    fileType: row.fileType,
  });

const getBrowserFileIcon = (file: File) =>
  getMimeFileIcon({ mime: file.type, name: file.name, className: browserFileIconClass });

export { getBrowserFileIcon, getMimeFileIcon, getRowIcon };
