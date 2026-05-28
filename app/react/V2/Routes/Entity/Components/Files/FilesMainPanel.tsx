import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { FilesTableSection } from './FilesTableSection.js';
import { FilesToolbar } from './FilesToolbar.js';
import { EntityFileRow } from './types.js';

const FilesMainPanel = () => {
  const {
    entity,
    primaryRows,
    supportingRows,
    focusedRow,
    selectedRowIds,
    setFocusedRowId,
    setSelectedRowIds,
    setDrawerTab,
    setIsEditing,
    requestDeleteRow,
  } = useEntityFiles();

  const allRows = [...primaryRows, ...supportingRows];

  const onFocus = (row: EntityFileRow) => {
    setFocusedRowId(row.rowId);
    setDrawerTab('file');
  };

  return (
    <div className="flex gap-4 h-full min-h-0 flex-col">
      <FilesTableSection
        title="Primary documents"
        rows={primaryRows}
        selectedRowIds={selectedRowIds}
        focusedRowId={focusedRow?.rowId}
        onSelectRows={setSelectedRowIds}
        onFocusRow={onFocus}
        onEditRow={row => {
          onFocus(row);
          setIsEditing(true);
        }}
        onDeleteRow={requestDeleteRow}
      />
      <FilesTableSection
        title="Supporting files"
        rows={supportingRows}
        selectedRowIds={selectedRowIds}
        focusedRowId={focusedRow?.rowId}
        onSelectRows={setSelectedRowIds}
        onFocusRow={onFocus}
        onEditRow={row => {
          onFocus(row);
          setIsEditing(true);
        }}
        onDeleteRow={requestDeleteRow}
      />
      {allRows.length === 0 ? (
        <div className="flex h-full items-center justify-center text-ink-muted">
          <Translate>No files available</Translate>
        </div>
      ) : null}

      <FilesToolbar
        totalCount={allRows.length}
        selectedCount={selectedRowIds.length}
        onAddFile={() => setDrawerTab('translations')}
        onSelectAll={() => setSelectedRowIds(allRows.map(row => row.rowId))}
        onDeselectAll={() => setSelectedRowIds([])}
      />
    </div>
  );
};

export { FilesMainPanel };
