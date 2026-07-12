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
  } = useEntityFiles();

  const allRows = [...primaryRows, ...supportingRows];

  const onFocus = useCallback(
    (row: EntityFileRow) => {
      setFocusedRowId(row.rowId);
      navigateToFilesSideTab('file');
    },
    [setFocusedRowId, navigateToFilesSideTab]
  );

  return (
    <div className="flex h-full flex-1 flex-col gap-4 bg-warm p-3">
      <FilesTableSection
        title="Primary documents"
        rows={primaryRows}
        selectedRowIds={selectedRowIds}
        focusedRowId={focusedRow?.rowId}
        onSelectRows={setSelectedRowIds}
        onFocusRow={onFocus}
      />
      <FilesTableSection
        title="Supporting files"
        rows={supportingRows}
        selectedRowIds={selectedRowIds}
        focusedRowId={focusedRow?.rowId}
        onSelectRows={setSelectedRowIds}
        onFocusRow={onFocus}
      />
      {allRows.length === 0 ? (
        <div className="flex h-full items-center justify-center text-ink-muted">
          <Translate>No files available</Translate>
        </div>
      ) : null}
    </div>
  );
};

export { FilesTab };
