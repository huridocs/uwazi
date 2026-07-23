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

const fileDownloadUrl = (row: EntityFileRow) => {
  const base = row.raw.url || (row.raw.filename ? `/api/files/${row.raw.filename}` : '');
  if (!base) return '';
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
    requestDeleteRow,
    requestDeleteSelected,
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
      <EntityTabFooter highlighted>
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            variant="warm"
            onClick={() => downloadRows(selectedRows)}
            className="inline-flex items-center gap-1.5"
          >
            <ArrowDownTrayIcon className="h-3 w-3 text-ink-tertiary" />
            <Translate>Download all</Translate>
          </Button>
          {deletableSelectedRows.length > 0 ? (
            <EntityWriteAuthorization>
              <Button
                variant="dangerSubtle"
                onClick={requestDeleteSelected}
                className="inline-flex items-center gap-1.5"
              >
                <TrashIcon className="h-3 w-3" />
                <Translate>Delete</Translate> {deletableSelectedRows.length}
              </Button>
            </EntityWriteAuthorization>
          ) : null}
        </div>
      </EntityTabFooter>
    );
  }

  if (mode !== 'focused' || !focusedRow) {
    return <EntityTabFooter />;
  }

  const fileUrl =
    focusedRow.raw.url || (focusedRow.raw.filename ? `/api/files/${focusedRow.raw.filename}` : '');

  if (!fileUrl) {
    return <EntityTabFooter />;
  }

  return (
    <EntityTabFooter>
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {filePanelMode === 'preview' ? (
            <Button
              variant="warm"
              onClick={closeFilePreview}
              className="inline-flex items-center gap-1.5"
            >
              <ArrowLeftIcon className="h-3 w-3 text-ink-tertiary" />
              <Translate>Back to details</Translate>
            </Button>
          ) : (
            <Button
              variant="warm"
              onClick={openFilePreview}
              className="inline-flex items-center gap-1.5"
            >
              <EyeIcon className="h-3 w-3 text-ink-tertiary" />
              <Translate>View</Translate>
            </Button>
          )}
          <a
            href={focusedRow.raw.filename ? `${fileUrl}?download=true` : fileUrl}
            className="inline-flex"
          >
            <Button variant="warm" className="inline-flex items-center gap-1.5">
              <ArrowDownTrayIcon className="h-3 w-3 text-ink-tertiary" />
              <Translate>Download</Translate>
            </Button>
          </a>
        </div>
        {filePanelMode === 'details' && isFileRowSelectable(focusedRow) ? (
          <EntityWriteAuthorization>
            <Button
              variant="dangerSubtle"
              onClick={() => requestDeleteRow(focusedRow)}
              className="inline-flex items-center gap-1.5"
            >
              <TrashIcon className="h-3 w-3" />
              <Translate>Delete</Translate>
            </Button>
          </EntityWriteAuthorization>
        ) : null}
      </div>
    </EntityTabFooter>
  );
};

export { FileTabFooter };
