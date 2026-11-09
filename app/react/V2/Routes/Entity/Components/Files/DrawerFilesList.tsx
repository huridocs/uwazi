import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import {
  FileDownloadButton,
  fileDownloadUrl,
} from '#V2/Routes/Entity/Tabs/footers/FileDownloadButton.js';
import { AddTranslationButton } from './AddTranslationButton.js';
import { DrawerFileRow } from './DrawerFileRow.js';
import { FilePreviewView } from './FilePreviewView.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { EntityFileRow } from './types.js';

const sectionHeaderClass =
  'mb-3 px-1 text-nano font-semibold uppercase tracking-wider text-ink-tertiary';

const openedFile = (row: EntityFileRow, onBack: () => void) => {
  const url = fileDownloadUrl(row);
  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto">
        <FilePreviewView row={row} />
      </div>
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-t border-border bg-paper px-3">
        <Button variant="warm" className="inline-flex items-center" onClick={onBack}>
          <ArrowLeftIcon className="h-3 w-3 shrink-0 text-ink-tertiary" />
          <Translate>Back to files</Translate>
        </Button>
        {url ? <FileDownloadButton href={url} /> : <span />}
      </div>
    </>
  );
};

const DrawerFilesList = () => {
  const { primaryRows, supportingRows, saveRow, openFilePreviewForRow, closeFilePreview } =
    useEntityFiles();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [preview, setPreview] = useState<EntityFileRow | null>(null);

  useEffect(() => () => closeFilePreview(), [closeFilePreview]);

  const onView = useCallback(
    (row: EntityFileRow) => {
      if (row.status === 'processing') return;
      if (row.kind === 'link') {
        const url = row.raw.url || '';
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      setPreview(row);
      openFilePreviewForRow(row.rowId);
    },
    [openFilePreviewForRow]
  );

  const onEdit = useCallback((row: EntityFileRow) => {
    setEditingRowId(row.rowId);
  }, []);

  const onCancelEdit = useCallback(() => {
    setEditingRowId(null);
  }, []);

  const onCommit = useCallback(
    async (payload: { _id: string; originalname: string; language?: string }) => {
      await saveRow(payload);
      setEditingRowId(null);
    },
    [saveRow]
  );

  const primaryCountLabel =
    primaryRows.length === 1
      ? `${primaryRows.length} ${t('System', 'file', null, false)}`
      : `${primaryRows.length} ${t('System', 'files', null, false)}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {preview
        ? openedFile(preview, () => {
            setPreview(null);
            closeFilePreview();
          })
        : null}
      <div className={`min-h-0 flex-1 overflow-auto px-3 py-4 pb-8 ${preview ? 'hidden' : ''}`}>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <div className={sectionHeaderClass}>
            <Translate>Primary documents</Translate>
          </div>
          <span className="shrink-0 text-nano tabular-nums text-ink-tertiary">
            {primaryCountLabel}
          </span>
        </div>
        {primaryRows.length === 0 ? (
          <p className="mb-5 px-1 text-xs italic text-ink-tertiary">
            <Translate>No primary documents</Translate>
          </p>
        ) : (
          <section className="mb-6">
            <div className="space-y-2">
              {primaryRows.map(row => (
                <DrawerFileRow
                  key={row.rowId}
                  row={row}
                  editing={editingRowId === row.rowId}
                  onView={onView}
                  onEdit={onEdit}
                  onCancelEdit={onCancelEdit}
                  onCommit={onCommit}
                />
              ))}
            </div>
            <AddTranslationButton />
          </section>
        )}

        <div className={sectionHeaderClass}>
          <Translate>Supporting files</Translate>
        </div>
        {supportingRows.length === 0 ? (
          <p className="px-1 text-xs italic text-ink-tertiary">
            <Translate>No supporting files yet. Add a file to get started.</Translate>
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {supportingRows.map(row => (
              <DrawerFileRow
                key={row.rowId}
                row={row}
                editing={editingRowId === row.rowId}
                onView={onView}
                onEdit={onEdit}
                onCancelEdit={onCancelEdit}
                onCommit={onCommit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { DrawerFilesList };
