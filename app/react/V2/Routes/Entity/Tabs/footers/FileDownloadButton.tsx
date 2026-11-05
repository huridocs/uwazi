import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { zipSync } from 'fflate';
import { t, Translate } from '#app/I18N/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { Button } from '#V2/Components/UI/index.js';
import type { EntityFileRow } from '../../Components/Files/types.js';

const iconClass = 'h-3 w-3 shrink-0 text-ink-tertiary';

const fileDownloadUrl = (row: EntityFileRow) => {
  const base = row.raw.url || (row.raw.filename ? `/api/files/${row.raw.filename}` : '');
  if (!base || row.kind === 'link') return '';
  return row.raw.filename ? `${base}?download=true` : base;
};

const triggerDownload = (url: string, filename = '') => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const nextName = (base: string, used: Set<string>) => {
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  let index = 2;
  let next = `${stem} (${index})${ext}`;
  while (used.has(next)) {
    index += 1;
    next = `${stem} (${index})${ext}`;
  }
  return next;
};

const zipEntryName = (name: string, used: Set<string>) => {
  const base = name.replace(/[\\/]/g, '').trim() || 'file';
  const entry = used.has(base) ? nextName(base, used) : base;
  used.add(entry);
  return entry;
};

const downloadRowsAsZip = async (rows: EntityFileRow[], filename: string) => {
  const used = new Set<string>();
  const files: Record<string, Uint8Array> = {};
  const named = rows.map(row => ({
    name: zipEntryName(row.raw.originalname || row.displayName, used),
    row,
  }));
  await Promise.all(
    named.map(async item => {
      const response = await fetch(fileDownloadUrl(item.row), { credentials: 'same-origin' });
      if (!response.ok) throw new Error('file not found');
      files[item.name] = new Uint8Array(await response.arrayBuffer());
    })
  );
  const href = URL.createObjectURL(new Blob([zipSync(files, { level: 0 })]));
  triggerDownload(href, filename);
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
};

const canDownloadRow = (row: EntityFileRow) =>
  row.status !== 'processing' && Boolean(fileDownloadUrl(row));

const downloadRows = async (rows: EntityFileRow[], zipName = 'files.zip') => {
  const ready = rows.filter(canDownloadRow);
  if (ready.length <= 1) {
    ready.forEach(row => triggerDownload(fileDownloadUrl(row)));
    return;
  }
  try {
    await downloadRowsAsZip(ready, zipName);
  } catch {
    notify(t('System', 'Something went wrong', null, false), 'error');
  }
};

const FileDownloadButton = ({ href }: { href: string }) => (
  <Button variant="warm" className="inline-flex items-center" onClick={() => triggerDownload(href)}>
    <ArrowDownTrayIcon className={iconClass} />
    <Translate>Download</Translate>
  </Button>
);

export {
  FileDownloadButton,
  canDownloadRow,
  downloadRows,
  downloadRowsAsZip,
  fileDownloadUrl,
  triggerDownload,
  iconClass,
};
