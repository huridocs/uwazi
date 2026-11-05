import React, { useCallback } from 'react';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { TranslationsPanel } from '../../Components/Files/TranslationsPanel.js';
import type { EntityFileRow } from '../../Components/Files/types.js';
import { useEntityTabNavigation } from '../EntityTabsContext.js';

const openFileLink = (row: EntityFileRow) => {
  const url = row.raw.url || '';
  if (row.kind === 'link' && url) window.open(url, '_blank', 'noopener,noreferrer');
  return row.kind === 'link';
};

const TranslationsTab = () => {
  const {
    focusedRow,
    primaryRows,
    setFocusedRowId,
    requestDeleteRow,
    navigateToFilesSideTab,
    openFilePreviewForRow,
  } = useEntityFiles();
  const { showSidePane } = useEntityTabNavigation();

  const revealFileSide = useCallback(() => {
    navigateToFilesSideTab('file');
    showSidePane();
  }, [navigateToFilesSideTab, showSidePane]);

  const onFocusRow = useCallback(
    (row: EntityFileRow) => {
      setFocusedRowId(row.rowId);
      revealFileSide();
    },
    [revealFileSide, setFocusedRowId]
  );

  const onViewRow = useCallback(
    (row: EntityFileRow) => {
      if (openFileLink(row)) return;
      openFilePreviewForRow(row.rowId);
      revealFileSide();
    },
    [openFilePreviewForRow, revealFileSide]
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
