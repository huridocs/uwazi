import React from 'react';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { TranslationsPanel } from '../../Components/Files/TranslationsPanel.js';

const TranslationsTab = () => {
  const {
    focusedRow,
    primaryRows,
    setFocusedRowId,
    requestDeleteRow,
    navigateToFilesSideTab,
  } = useEntityFiles();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-8">
      {focusedRow ? (
        <TranslationsPanel
          focusedRow={focusedRow}
          primaryRows={primaryRows}
          onFocusRow={row => {
            setFocusedRowId(row.rowId);
            navigateToFilesSideTab('file');
          }}
          onDeleteRow={requestDeleteRow}
        />
      ) : null}
    </div>
  );
};

export { TranslationsTab };
