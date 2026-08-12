import React from 'react';
import { ArrowDownTrayIcon, ArrowLeftIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import type { EntityFileRow } from '../../Components/Files/types.js';
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
          <Button variant="warm" className="inline-flex items-center" onClick={closeFilePreview}>
            <ArrowLeftIcon className={iconClass} />
            <Translate>Back to details</Translate>
          </Button>
          {downloadUrl ? <FileDownloadButton href={downloadUrl} /> : <span />}
        </div>
      </EntityTabFooter>
    );
  }

  return (
    <EntityTabFooter inset="side">
      <div className="flex w-full items-center justify-between gap-2">
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
};

export { FileTabFooter };
