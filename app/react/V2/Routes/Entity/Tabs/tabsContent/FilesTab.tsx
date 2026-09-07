import React, { useCallback } from 'react';
import { Translate } from '#app/I18N/index.js';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { FilesTableSection } from '../../Components/Files/FilesTableSection.js';
import type { EntityFileRow } from '../../Components/Files/types.js';

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

  const onFocus = useCallback(
    (row: EntityFileRow) => {
      setFocusedRowId(row.rowId);
      navigateToFilesSideTab('file');
    },
    [setFocusedRowId, navigateToFilesSideTab]
  );

  const onView = useCallback(
    (row: EntityFileRow) => {
      openFilePreviewForRow(row.rowId);
      navigateToFilesSideTab('file');
    },
    [navigateToFilesSideTab, openFilePreviewForRow]
  );

  const onRename = useCallback(
    (row: EntityFileRow) => {
      openFileEdit(row.rowId, 'name');
      navigateToFilesSideTab('file');
    },
    [navigateToFilesSideTab, openFileEdit]
  );

  const onChangeLanguage = useCallback(
    (row: EntityFileRow) => {
      openFileEdit(row.rowId, 'language');
      navigateToFilesSideTab('file');
    },
    [navigateToFilesSideTab, openFileEdit]
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-5 overflow-auto bg-warm p-4 pb-8">
      <FilesTableSection
        title="Primary documents"
        rows={primaryRows}
        selectedRowIds={selectedRowIds}
        focusedRowId={focusedRow?.rowId}
        emptyDescription={
          <Translate>
            No primary documents yet. Promote a supporting file or add a new one.
          </Translate>
        }
        onSelectRows={setSelectedRowIds}
        onFocusRow={onFocus}
        onViewRow={onView}
        onRenameRow={onRename}
        onChangeLanguageRow={onChangeLanguage}
        onDeleteRow={requestDeleteRow}
      />
      <FilesTableSection
        title="Supporting files"
        rows={supportingRows}
        selectedRowIds={selectedRowIds}
        focusedRowId={focusedRow?.rowId}
        showLanguageColumn={false}
        emptyDescription={
          <Translate>No supporting files yet. Add a file to get started.</Translate>
        }
        onSelectRows={setSelectedRowIds}
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
