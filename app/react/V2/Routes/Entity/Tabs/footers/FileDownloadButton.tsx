import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import type { EntityFileRow } from '../../Components/Files/types.js';

const iconClass = 'h-3 w-3 shrink-0 text-ink-tertiary';

const fileDownloadUrl = (row: EntityFileRow) => {
  const base = row.raw.url || (row.raw.filename ? `/api/files/${row.raw.filename}` : '');
  if (!base || row.kind === 'link') return '';
  return row.raw.filename ? `${base}?download=true` : base;
};

const triggerDownload = (url: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const downloadRows = (rows: EntityFileRow[]) => {
  rows.forEach(row => {
    const url = fileDownloadUrl(row);
    if (url) triggerDownload(url);
  });
};

const FileDownloadButton = ({ href }: { href: string }) => (
  <Button variant="warm" className="inline-flex items-center" onClick={() => triggerDownload(href)}>
    <ArrowDownTrayIcon className={iconClass} />
    <Translate>Download</Translate>
  </Button>
);

export { FileDownloadButton, downloadRows, fileDownloadUrl, triggerDownload, iconClass };
