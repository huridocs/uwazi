import React from 'react';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { FilesToolbar } from '../../Components/Files/FilesToolbar.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

const FilesTabFooter = () => {
  const { primaryRows, supportingRows, selectedRowIds, setSelectedRowIds, navigateToFilesSideTab } =
    useEntityFiles();

  const allRows = [...primaryRows, ...supportingRows];

  return (
    <EntityTabFooter>
      <FilesToolbar
        totalCount={allRows.length}
        selectedCount={selectedRowIds.length}
        onAddFile={() => navigateToFilesSideTab('translations')}
        onSelectAll={() => setSelectedRowIds(allRows.map(row => row.rowId))}
        onDeselectAll={() => setSelectedRowIds([])}
      />
    </EntityTabFooter>
  );
};

export { FilesTabFooter };
