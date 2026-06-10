import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { PDF } from '#V2/Components/PDFViewer/index.js';
import { Button } from '#V2/Components/UI/index.js';
import type { EntityFileRow } from './types.js';

const FilePreviewView = ({ row }: { row: EntityFileRow }) => {
  const fileUrl = row.raw.url || (row.raw.filename ? `/api/files/${row.raw.filename}` : '');
  const mime = row.raw.mimetype || '';
  const isExternalUrl = row.fileType === 'externalURL' || /^https?:\/\//.test(fileUrl);
  const isPdf =
    mime === 'application/pdf' ||
    /\.pdf($|\?)/i.test(fileUrl) ||
    row.fileType === 'document' ||
    row.fileType === 'mainDocument';
  const isImage = /^image\//.test(mime);
  const isVideo = /^video\//.test(mime);
  const isAudio = /^audio\//.test(mime);

  if (!fileUrl) {
    return (
      <div className="flex h-full items-center justify-center text-ink-muted">
        <Translate>File preview unavailable</Translate>
      </div>
    );
  }

  if (isExternalUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-xl rounded-md border border-border-soft bg-paper p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emphasis text-parchment">
            <ArrowTopRightOnSquareIcon className="h-7 w-7" />
          </div>
          <div className="mb-4 break-all text-2xl text-ink">{fileUrl}</div>
          <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex">
            <Button variant="primary">
              <Translate>Open link</Translate>
            </Button>
          </a>
        </div>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="flex h-full items-center justify-center">
        <img
          src={fileUrl}
          alt={row.displayName}
          className="max-h-full max-w-full rounded-md border border-border-soft object-contain"
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="flex h-full items-center justify-center">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          controls
          src={fileUrl}
          className="max-h-full max-w-full rounded-md border border-border-soft bg-black object-contain"
        />
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-xl rounded-md border border-border-soft bg-paper p-6">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={fileUrl} className="w-full" />
          <div className="mt-4 text-center text-xl text-ink-secondary">{row.displayName}</div>
        </div>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="h-full w-full">
        <PDF fileUrl={fileUrl} size={{ height: '100%', width: '100%' }} />
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <iframe
        title={row.displayName}
        src={fileUrl}
        className="h-full w-full rounded-md border border-border-soft bg-paper"
      />
    </div>
  );
};

export { FilePreviewView };
