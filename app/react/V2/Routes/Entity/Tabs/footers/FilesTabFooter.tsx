import React from 'react';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { FilesToolbar } from '../../Components/Files/FilesToolbar.js';
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
  const hasSelection = selectedRowIds.length > 0;

  return (
    <EntityTabFooter highlighted={hasSelection}>
      <FilesToolbar
        totalCount={allRows.length}
        selectedCount={selectedRowIds.length}
        onAddFile={() => requestAddFile('main')}
        onSelectAll={() => setSelectedRowIds(allRows.map(row => row.rowId))}
        onDeselectAll={() => setSelectedRowIds([])}
        onDeleteSelected={requestDeleteSelected}
      />
    </EntityTabFooter>
  );
};

export { FilesTabFooter };
