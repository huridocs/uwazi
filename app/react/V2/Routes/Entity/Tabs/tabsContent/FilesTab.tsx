import React, { useCallback } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { FilesTableSection } from '../../Components/Files/FilesTableSection.js';
import type { EntityFileRow } from '../../Components/Files/types.js';
import { useEntityTabNavigation } from '../EntityTabsContext.js';

const openFileLink = (row: EntityFileRow) => {
  const url = row.raw.url || '';
  if (row.kind === 'link' && url) window.open(url, '_blank', 'noopener,noreferrer');
  return row.kind === 'link';
};

const FilesTab = () => {
  const {
    primaryRows,
    supportingRows,
    focusedRow,
    selectedRowIds,
    setFocusedRowId,
    setSelectedRowIds,
    navigateToFilesSideTab,
    openFilePreviewForRow,
    openFileEdit,
    requestDeleteRow,
  } = useEntityFiles();
  const { showSidePane } = useEntityTabNavigation();

  const revealFileSide = useCallback(() => {
    navigateToFilesSideTab('file');
    showSidePane();
  }, [navigateToFilesSideTab, showSidePane]);

  const onSelectRows = useCallback(
    (ids: string[]) => {
      setSelectedRowIds(ids);
      if (ids.length > 1) revealFileSide();
    },
    [revealFileSide, setSelectedRowIds]
  );

  const onFocus = useCallback(
    (row: EntityFileRow) => {
      setFocusedRowId(row.rowId);
      revealFileSide();
    },
    [revealFileSide, setFocusedRowId]
  );

  const onView = useCallback(
    (row: EntityFileRow) => {
      if (openFileLink(row)) return;
      openFilePreviewForRow(row.rowId);
      revealFileSide();
    },
    [openFilePreviewForRow, revealFileSide]
  );

  const onRename = useCallback(
    (row: EntityFileRow) => {
      openFileEdit(row.rowId, 'name');
      revealFileSide();
    },
    [openFileEdit, revealFileSide]
  );

  const onChangeLanguage = useCallback(
    (row: EntityFileRow) => {
      openFileEdit(row.rowId, 'language');
      revealFileSide();
    },
    [openFileEdit, revealFileSide]
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-5 overflow-auto bg-warm p-4 pb-8">
      <FilesTableSection
        title={t('System', 'Primary documents', null, false)}
        rows={primaryRows}
        selectedRowIds={selectedRowIds}
        focusedRowId={focusedRow?.rowId}
        emptyDescription={
          <Translate>No primary documents yet. Add a file to get started.</Translate>
        }
        onSelectRows={onSelectRows}
        onFocusRow={onFocus}
        onViewRow={onView}
        onRenameRow={onRename}
        onChangeLanguageRow={onChangeLanguage}
        onDeleteRow={requestDeleteRow}
      />
      <FilesTableSection
        title={t('System', 'Supporting files', null, false)}
        rows={supportingRows}
        selectedRowIds={selectedRowIds}
        focusedRowId={focusedRow?.rowId}
        showLanguageColumn={false}
        emptyDescription={
          <Translate>No supporting files yet. Add a file to get started.</Translate>
        }
        onSelectRows={onSelectRows}
        onFocusRow={onFocus}
        onViewRow={onView}
        onRenameRow={onRename}
        onChangeLanguageRow={onChangeLanguage}
        onDeleteRow={requestDeleteRow}
      />
    </div>
  );
};

export { FilesTab };
