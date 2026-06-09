import React from 'react';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { TranslationsPanel } from '../../Components/Files/TranslationsPanel.js';

const TranslationsTab = () => {
  const {
    focusedRow,
    primaryRows,
    setFocusedRowId,
    requestDeleteRow,
    requestAddFile,
    navigateToFilesSideTab,
  } = useEntityFiles();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {focusedRow ? (
        <div className="h-full overflow-auto">
          <TranslationsPanel
            focusedRow={focusedRow}
            primaryRows={primaryRows}
            onFocusRow={row => {
              setFocusedRowId(row.rowId);
              navigateToFilesSideTab('file');
            }}
            onDeleteRow={requestDeleteRow}
            onAddTranslation={() => requestAddFile('translation')}
          />
        </div>
      ) : null}
    </div>
  );
};

export { TranslationsTab };
