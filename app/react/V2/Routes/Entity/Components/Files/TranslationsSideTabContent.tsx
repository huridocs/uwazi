import React from 'react';
import { useEntityFiles } from './EntityFilesContext.js';
import { TranslationsPanel } from './TranslationsPanel.js';

const TranslationsSideTabContent = () => {
  const {
    focusedRow,
    primaryRows,
    setFocusedRowId,
    requestDeleteRow,
    uploadTranslation,
    navigateToFilesSideTab,
  } = useEntityFiles();

  if (!focusedRow) {
    return null;
  }

  return (
    <div className="h-full overflow-auto">
      <TranslationsPanel
        focusedRow={focusedRow}
        primaryRows={primaryRows}
        onFocusRow={row => {
          setFocusedRowId(row.rowId);
          navigateToFilesSideTab('file');
        }}
        onDeleteRow={requestDeleteRow}
        onUpload={uploadTranslation}
      />
    </div>
  );
};

export { TranslationsSideTabContent };
