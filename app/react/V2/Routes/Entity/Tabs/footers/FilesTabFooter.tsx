import React from 'react';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { FilesToolbar } from '../../Components/Files/FilesToolbar.js';
import { isFileRowSelectable } from '../../Components/Files/fileHelpers.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

const FilesTabFooter = () => {
  const {
    primaryRows,
    supportingRows,
    selectedRowIds,
    setSelectedRowIds,
    requestAddFile,
    requestDeleteSelected,
  } = useEntityFiles();

  const allRows = [...primaryRows, ...supportingRows];
  const selectableRows = allRows.filter(isFileRowSelectable);
  const selectedSelectableCount = selectableRows.filter(row =>
    selectedRowIds.includes(row.rowId)
  ).length;
  const hasSelection = selectedSelectableCount > 0;

  return (
    <EntityTabFooter highlighted={hasSelection}>
      <FilesToolbar
        totalCount={selectableRows.length}
        selectedCount={selectedSelectableCount}
        onAddFile={() => requestAddFile('main')}
        onSelectAll={() => setSelectedRowIds(selectableRows.map(row => row.rowId))}
        onDeselectAll={() => setSelectedRowIds([])}
        onDeleteSelected={requestDeleteSelected}
      />
    </EntityTabFooter>
  );
};

export { FilesTabFooter };
