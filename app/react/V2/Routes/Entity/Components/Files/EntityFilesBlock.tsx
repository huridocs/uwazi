import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import {
  FileDownloadButton,
  downloadRows,
  fileDownloadUrl,
  iconClass,
  triggerDownload,
} from '../../Tabs/footers/FileDownloadButton.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { FilePreviewView } from './FilePreviewView.js';
import type { EntityFileRow } from './types.js';

const extensionSuffix = /\.[A-Za-z0-9]{1,5}$/;

const shownName = (row: EntityFileRow) =>
  row.kind === 'link' ? row.displayName : row.displayName.replace(extensionSuffix, '');

const factsLine = (row: EntityFileRow) =>
  [row.typeLabel, row.sizeLabel, row.languageKey]
    .map(value => value.trim())
    .filter(value => value !== '' && value !== '—')
    .join(' · ');

const foldLimit = 6;
const foldedCount = 5;

const openRow = (row: EntityFileRow, onPreview: (row: EntityFileRow) => void) => {
  if (row.kind === 'link') {
    const url = row.raw.url || '';
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  onPreview(row);
};

const canDownload = (row: EntityFileRow) =>
  row.status !== 'processing' && Boolean(fileDownloadUrl(row));

const rowLine = (row: EntityFileRow, onPreview: (row: EntityFileRow) => void) => {
  const processing = row.status === 'processing';
  const url = processing ? '' : fileDownloadUrl(row);
  const facts = factsLine(row);
  return (
    <div key={row.rowId} className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        title={row.displayName}
        disabled={processing}
        className={`flex min-w-0 flex-1 flex-col items-start text-left ${processing ? 'opacity-60' : ''}`}
        onClick={() => {
          if (!processing) openRow(row, onPreview);
        }}
      >
        <span dir="ltr" className="w-full truncate text-xs font-medium text-ink">
          {shownName(row)}
        </span>
        {facts ? <span className="text-nano text-ink-tertiary">{facts}</span> : null}
      </button>
      {url ? (
        <button
          type="button"
          aria-label={`${t('System', 'Download', null, false)} ${row.displayName}`}
          className="inline-flex shrink-0 rounded-md p-1 text-ink-tertiary hover:text-ink"
          onClick={() => triggerDownload(url)}
        >
          <ArrowDownTrayIcon className={iconClass} />
        </button>
      ) : null}
    </div>
  );
};

const fileGroup = (
  rows: EntityFileRow[],
  label: React.ReactNode,
  onPreview: (row: EntityFileRow) => void
) => {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-nano font-semibold uppercase tracking-wider text-ink-tertiary">
        {label}
      </h3>
      {rows.map(row => rowLine(row, onPreview))}
    </div>
  );
};

const listedFiles = (
  primaryRows: EntityFileRow[],
  supportingRows: EntityFileRow[],
  expanded: boolean
) => {
  const ordered = [...primaryRows, ...supportingRows];
  const primaryTake = Math.min(primaryRows.length, foldedCount - 1);
  let visible = ordered;
  if (
    !expanded &&
    ordered.length > foldLimit &&
    primaryRows.length > 0 &&
    supportingRows.length > 0
  ) {
    visible = [
      ...primaryRows.slice(0, primaryTake),
      ...supportingRows.slice(0, foldedCount - primaryTake),
    ];
  } else if (!expanded && ordered.length > foldLimit) {
    visible = ordered.slice(0, foldedCount);
  }
  const primaryIds = new Set(primaryRows.map(row => row.rowId));
  const downloadable = ordered.filter(canDownload);
  return {
    ordered,
    total: ordered.length,
    visiblePrimary: visible.filter(row => primaryIds.has(row.rowId)),
    visibleSupporting: visible.filter(row => !primaryIds.has(row.rowId)),
    downloadable,
  };
};

const previewModal = (row: EntityFileRow, onClose: () => void) => {
  const url = fileDownloadUrl(row);
  return (
    <Modal size="xxxl" ariaLabel={row.displayName}>
      <Modal.Header>
        <h2 className="truncate text-sm font-bold text-ink">{row.displayName}</h2>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      <Modal.Body className="min-h-96">
        <FilePreviewView row={row} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="warm" onClick={onClose}>
          <Translate>Close</Translate>
        </Button>
        {url ? <FileDownloadButton href={url} /> : null}
      </Modal.Footer>
    </Modal>
  );
};

const EntityFilesBlock = () => {
  const { primaryRows, supportingRows } = useEntityFiles();
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<EntityFileRow | null>(null);
  const files = listedFiles(primaryRows, supportingRows, expanded);
  if (files.total === 0) return null;

  return (
    <section
      data-testid="entity-files"
      className="flex flex-col gap-2 rounded-lg border border-border-40 bg-paper px-4 py-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-meta font-semibold uppercase tracking-wider text-ink-secondary">
          <Translate>Files</Translate>
        </h3>
        {files.downloadable.length > 1 ? (
          <Button
            variant="warm"
            className="inline-flex items-center"
            data-part="download-all"
            onClick={() => downloadRows(files.downloadable)}
          >
            <ArrowDownTrayIcon className={iconClass} />
            <Translate>Download all</Translate>
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-5">
        {fileGroup(files.visiblePrimary, <Translate>Primary documents</Translate>, setPreview)}
        {fileGroup(files.visibleSupporting, <Translate>Supporting files</Translate>, setPreview)}
      </div>
      {files.total > foldLimit && !expanded ? (
        <button
          type="button"
          className="self-start text-xs font-medium text-ink-secondary"
          onClick={() => setExpanded(true)}
        >
          <Translate>Show all</Translate> {files.total} <Translate>files</Translate>
        </button>
      ) : null}
      {preview ? previewModal(preview, () => setPreview(null)) : null}
    </section>
  );
};

export { EntityFilesBlock };
