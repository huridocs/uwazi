import React from 'react';
import { ArrowDownTrayIcon, ArrowLeftIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import type { EntityFileRow } from '../../Components/Files/types.js';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { isFileRowSelectable } from '../../Components/Files/fileHelpers.js';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { resolveFileTabFooterMode } from './fileTabFooterMode.js';

const iconClass = 'h-3 w-3 shrink-0 text-ink-tertiary';
const warmBtnClass =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink';
const deleteBtnClass =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-md border-transparent bg-emphasis-tint px-3 py-1.5 text-xs font-medium text-emphasis transition-colors hover:opacity-90';

const fileDownloadUrl = (row: EntityFileRow) => {
  const base = row.raw.url || (row.raw.filename ? `/api/files/${row.raw.filename}` : '');
  if (!base || row.kind === 'link') return '';
  return row.raw.filename ? `${base}?download=true` : base;
};

const downloadRows = (rows: EntityFileRow[]) => {
  rows.forEach(row => {
    const url = fileDownloadUrl(row);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
};

const DownloadLink = ({ href }: { href: string }) => (
  <a href={href} download rel="noreferrer" className={warmBtnClass}>
    <ArrowDownTrayIcon className={iconClass} />
    <Translate>Download</Translate>
  </a>
);

const FileTabFooter = () => {
  const {
    focusedRow,
    primaryRows,
    supportingRows,
    selectedRowIds,
    isEditing,
    filePanelMode,
    openFilePreview,
    closeFilePreview,
    requestDeleteSelected,
    requestDeleteRow,
  } = useEntityFiles();

  const allRows = [...primaryRows, ...supportingRows];
  const selectedRows = allRows.filter(row => selectedRowIds.includes(row.rowId));
  const deletableSelectedRows = selectedRows.filter(isFileRowSelectable);
  const mode = resolveFileTabFooterMode({
    isEditing,
    isMulti: selectedRows.length > 1,
    hasFocusedRow: Boolean(focusedRow),
    filePanelMode,
  });

  if (mode === 'multi') {
    return (
      <EntityTabFooter highlighted inset="side">
        <div className="flex w-full items-center justify-between gap-2">
          <button type="button" onClick={() => downloadRows(selectedRows)} className={warmBtnClass}>
            <ArrowDownTrayIcon className={iconClass} />
            <Translate>Download all</Translate>
          </button>
          {deletableSelectedRows.length > 0 ? (
            <EntityWriteAuthorization>
              <button type="button" onClick={requestDeleteSelected} className={deleteBtnClass}>
                <TrashIcon className="h-3 w-3 shrink-0" />
                <Translate>Delete</Translate> {deletableSelectedRows.length}
              </button>
            </EntityWriteAuthorization>
          ) : null}
        </div>
      </EntityTabFooter>
    );
  }

  if (mode !== 'focused' || !focusedRow) {
    return <EntityTabFooter inset="side" />;
  }

  const downloadUrl = fileDownloadUrl(focusedRow);
  const canDelete = isFileRowSelectable(focusedRow);
  const isPreview = filePanelMode === 'preview';

  if (isPreview) {
    return (
      <EntityTabFooter inset="side">
        <div className="flex w-full items-center justify-between gap-2">
          <button type="button" onClick={closeFilePreview} className={warmBtnClass}>
            <ArrowLeftIcon className={iconClass} />
            <Translate>Back to details</Translate>
          </button>
          {downloadUrl ? <DownloadLink href={downloadUrl} /> : <span />}
        </div>
      </EntityTabFooter>
    );
  }

  return (
    <EntityTabFooter inset="side">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={openFilePreview} className={warmBtnClass}>
            <EyeIcon className={iconClass} />
            <Translate>View</Translate>
          </button>
          {downloadUrl ? <DownloadLink href={downloadUrl} /> : null}
        </div>
        {canDelete ? (
          <EntityWriteAuthorization>
            <button
              type="button"
              onClick={() => requestDeleteRow(focusedRow)}
              className={deleteBtnClass}
            >
              <TrashIcon className="h-3 w-3 shrink-0" />
              <Translate>Delete</Translate>
            </button>
          </EntityWriteAuthorization>
        ) : null}
      </div>
    </EntityTabFooter>
  );
};

export { FileTabFooter };
