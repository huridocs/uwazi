import React, { useCallback, useState } from 'react';
import { Translate, t } from '#app/I18N/index.js';
import { AddTranslationButton } from './AddTranslationButton.js';
import { DrawerFileRow } from './DrawerFileRow.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { EntityFileRow } from './types.js';

const sectionHeaderClass =
  'mb-3 px-1 text-nano font-semibold uppercase tracking-wider text-ink-tertiary';

const DrawerFilesList = () => {
  const {
    primaryRows,
    supportingRows,
    mainDocumentId,
    navigateToFilesSideTab,
    openFilePreviewForRow,
    saveRow,
  } = useEntityFiles();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const onView = useCallback(
    (row: EntityFileRow) => {
      openFilePreviewForRow(row.rowId);
      navigateToFilesSideTab('file');
    },
    [navigateToFilesSideTab, openFilePreviewForRow]
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
      <div className="min-h-0 flex-1 overflow-auto px-3 py-4 pb-8">
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
                  active={row.rowId === mainDocumentId}
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
