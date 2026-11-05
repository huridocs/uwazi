import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { PDF as PdfViewer } from '#V2/Components/PDFViewer/index.js';
import { Button } from '#V2/Components/UI/index.js';
import type { EntityFileRow } from './types.js';

type PreviewKind = 'external' | 'image' | 'video' | 'audio' | 'pdf' | 'file';

const fileUrlFor = (row: EntityFileRow) =>
  row.raw.url || (row.raw.filename ? `/api/files/${row.raw.filename}` : '');

const filePreviewKind = (row: EntityFileRow, fileUrl: string): PreviewKind => {
  if (row.fileType === 'externalURL' || /^https?:\/\//.test(fileUrl)) return 'external';
  const mime = row.raw.mimetype || '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (
    mime === 'application/pdf' ||
    /\.pdf($|\?)/i.test(fileUrl) ||
    row.fileType === 'document' ||
    row.fileType === 'mainDocument'
  ) {
    return 'pdf';
  }
  return 'file';
};

const frameClass = 'flex h-full items-center justify-center';

const unavailablePreview = () => (
  <div className={`${frameClass} text-ink-muted`}>
    <Translate>File preview unavailable</Translate>
  </div>
);

const externalPreview = (fileUrl: string) => (
  <div className={frameClass}>
    <div className="w-full max-w-xl rounded-md border border-border-soft bg-paper p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emphasis text-parchment">
        <ArrowTopRightOnSquareIcon className="h-7 w-7" />
      </div>
      <div className="mb-4 break-all text-2xl text-ink">{fileUrl}</div>
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={t('System', 'Open link', null, false)}
        className="inline-flex"
      >
        <Button variant="primary">
          <Translate>Open link</Translate>
        </Button>
      </a>
    </div>
  </div>
);

const imagePreview = (fileUrl: string, name: string) => (
  <div className={frameClass}>
    <img
      src={fileUrl}
      alt={name}
      className="max-h-full max-w-full rounded-md border border-border-soft object-contain"
    />
  </div>
);

const videoPreview = (fileUrl: string) => (
  <div className={frameClass}>
    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
    <video
      controls
      src={fileUrl}
      className="max-h-full max-w-full rounded-md border border-border-soft bg-black object-contain"
    />
  </div>
);

const audioPreview = (fileUrl: string, name: string) => (
  <div className={frameClass}>
    <div className="w-full max-w-xl rounded-md border border-border-soft bg-paper p-6">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls src={fileUrl} className="w-full" />
      <div className="mt-4 text-center text-xl text-ink-secondary">{name}</div>
    </div>
  </div>
);

const filePreview = (fileUrl: string, name: string) => (
  <div className={frameClass}>
    <iframe
      title={name}
      src={fileUrl}
      className="h-full w-full rounded-md border border-border-soft bg-paper"
    />
  </div>
);

const previews: Record<
  Exclude<PreviewKind, 'pdf'>,
  (row: EntityFileRow, fileUrl: string) => React.ReactNode
> = {
  external: (_row, fileUrl) => externalPreview(fileUrl),
  image: (row, fileUrl) => imagePreview(fileUrl, row.displayName),
  video: (_row, fileUrl) => videoPreview(fileUrl),
  audio: (row, fileUrl) => audioPreview(fileUrl, row.displayName),
  file: (row, fileUrl) => filePreview(fileUrl, row.displayName),
};

const FilePreviewView = ({ row }: { row: EntityFileRow }): React.ReactElement => {
  const fileUrl = fileUrlFor(row);
  if (!fileUrl) return unavailablePreview();
  const kind = filePreviewKind(row, fileUrl);
  if (kind === 'pdf') {
    return (
      <div className="h-full w-full">
        <PdfViewer fileUrl={fileUrl} size={{ height: '100%', width: '100%' }} />
      </div>
    );
  }
  return <>{previews[kind](row, fileUrl)}</>;
};

export { FilePreviewView };
