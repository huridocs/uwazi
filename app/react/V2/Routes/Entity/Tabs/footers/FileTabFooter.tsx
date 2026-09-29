import React from 'react';
import { ArrowDownTrayIcon, ArrowLeftIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import type { EntityFilesContextValue } from '../../Components/Files/entityFilesContextTypes.js';
import type { EntityFileRow } from '../../Components/Files/types.js';
import type { FilePanelMode } from '../../Components/Files/useEntityFilesPanel.js';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { isFileRowSelectable } from '../../Components/Files/fileHelpers.js';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { resolveFileTabFooterMode } from './fileTabFooterMode.js';
import { FileDownloadButton, iconClass, triggerDownload } from './FileDownloadButton.js';

const fileDownloadUrl = (row: EntityFileRow) => {
  const base = row.raw.url || (row.raw.filename ? `/api/files/${row.raw.filename}` : '');
  if (!base || row.kind === 'link') return '';
  return row.raw.filename ? `${base}?download=true` : base;
};

const downloadRows = (rows: EntityFileRow[]) => {
  rows.forEach(row => {
    const url = fileDownloadUrl(row);
    if (url) triggerDownload(url);
  });
};

const multiFileFooter = (
  selectedRows: EntityFileRow[],
  deletableSelectedRows: EntityFileRow[],
  requestDeleteSelected: () => void
) => (
  <EntityTabFooter highlighted inset="side">
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <Button
        variant="warm"
        className="inline-flex items-center"
        onClick={() => downloadRows(selectedRows)}
      >
        <ArrowDownTrayIcon className={iconClass} />
        <Translate>Download all</Translate>
      </Button>
      {deletableSelectedRows.length > 0 ? (
        <EntityWriteAuthorization>
          <Button
            variant="dangerSubtle"
            className="inline-flex items-center gap-1.5"
            onClick={requestDeleteSelected}
          >
            <TrashIcon className="h-3 w-3 shrink-0" />
            <Translate>Delete</Translate> {deletableSelectedRows.length}
          </Button>
        </EntityWriteAuthorization>
      ) : null}
    </div>
  </EntityTabFooter>
);

const previewFileFooter = (downloadUrl: string, closeFilePreview: () => void) => (
  <EntityTabFooter inset="side">
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <Button variant="warm" className="inline-flex items-center" onClick={closeFilePreview}>
        <ArrowLeftIcon className={iconClass} />
        <Translate>Back to details</Translate>
      </Button>
      {downloadUrl ? <FileDownloadButton href={downloadUrl} /> : <span />}
    </div>
  </EntityTabFooter>
);

const detailsFileFooter = ({
  downloadUrl,
  canDelete,
  focusedRow,
  openFilePreview,
  requestDeleteRow,
}: {
  downloadUrl: string;
  canDelete: boolean;
  focusedRow: EntityFileRow;
  openFilePreview: () => void;
  requestDeleteRow: (row: EntityFileRow) => void;
}) => (
  <EntityTabFooter inset="side">
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button variant="warm" className="inline-flex items-center" onClick={openFilePreview}>
          <EyeIcon className={iconClass} />
          <Translate>View</Translate>
        </Button>
        {downloadUrl ? <FileDownloadButton href={downloadUrl} /> : null}
      </div>
      {canDelete ? (
        <EntityWriteAuthorization>
          <Button
            variant="dangerSubtle"
            className="inline-flex items-center gap-1.5"
            onClick={() => requestDeleteRow(focusedRow)}
          >
            <TrashIcon className="h-3 w-3 shrink-0" />
            <Translate>Delete</Translate>
          </Button>
        </EntityWriteAuthorization>
      ) : null}
    </div>
  </EntityTabFooter>
);

const focusedFileFooter = (state: {
  focusedRow: EntityFileRow;
  filePanelMode: FilePanelMode;
  openFilePreview: () => void;
  closeFilePreview: () => void;
  requestDeleteRow: (row: EntityFileRow) => void;
}) => {
  const downloadUrl = fileDownloadUrl(state.focusedRow);
  const canDelete = isFileRowSelectable(state.focusedRow);
  if (state.filePanelMode === 'preview') {
    return previewFileFooter(downloadUrl, state.closeFilePreview);
  }
  return detailsFileFooter({
    downloadUrl,
    canDelete,
    focusedRow: state.focusedRow,
    openFilePreview: state.openFilePreview,
    requestDeleteRow: state.requestDeleteRow,
  });
};

const fileTabFooterContent = (files: EntityFilesContextValue) => {
  const allRows = [...files.primaryRows, ...files.supportingRows];
  const selectedRows = allRows.filter(row => files.selectedRowIds.includes(row.rowId));
  const deletableSelectedRows = selectedRows.filter(isFileRowSelectable);
  const mode = resolveFileTabFooterMode({
    isEditing: files.isEditing,
    isMulti: selectedRows.length > 1,
    hasFocusedRow: Boolean(files.focusedRow),
    filePanelMode: files.filePanelMode,
  });
  if (mode === 'multi') {
    return multiFileFooter(selectedRows, deletableSelectedRows, files.requestDeleteSelected);
  }
  if (mode !== 'focused' || !files.focusedRow) {
    return <EntityTabFooter inset="side" />;
  }
  return focusedFileFooter({
    focusedRow: files.focusedRow,
    filePanelMode: files.filePanelMode,
    openFilePreview: files.openFilePreview,
    closeFilePreview: files.closeFilePreview,
    requestDeleteRow: files.requestDeleteRow,
  });
};

const FileTabFooter = () => fileTabFooterContent(useEntityFiles());

export { FileTabFooter };
