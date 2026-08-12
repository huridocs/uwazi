import React, { useCallback } from 'react';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { TranslationsPanel } from '../../Components/Files/TranslationsPanel.js';
import type { EntityFileRow } from '../../Components/Files/types.js';

const TranslationsTab = () => {
  const {
    focusedRow,
    primaryRows,
    setFocusedRowId,
    requestDeleteRow,
    navigateToFilesSideTab,
    openFilePreviewForRow,
  } = useEntityFiles();

  const onFocusRow = useCallback(
    (row: EntityFileRow) => {
      setFocusedRowId(row.rowId);
      navigateToFilesSideTab('file');
    },
    [setFocusedRowId, navigateToFilesSideTab]
  );

  const onViewRow = useCallback(
    (row: EntityFileRow) => {
      openFilePreviewForRow(row.rowId);
      navigateToFilesSideTab('file');
    },
    [navigateToFilesSideTab, openFilePreviewForRow]
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-8">
      {focusedRow ? (
        <TranslationsPanel
          focusedRow={focusedRow}
          primaryRows={primaryRows}
          onFocusRow={onFocusRow}
          onViewRow={onViewRow}
          onDeleteRow={requestDeleteRow}
        />
      ) : null}
    </div>
  );
};

export { TranslationsTab };
