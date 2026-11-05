import React from 'react';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { FilesToolbar } from '../../Components/Files/FilesToolbar.js';
import { isFileRowSelectable } from '../../Components/Files/fileHelpers.js';
import { canDownloadRow, downloadRows } from './FileDownloadButton.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

const FilesTabFooter = () => {
  const {
    entity,
    primaryRows,
    supportingRows,
    selectedRowIds,
    setSelectedRowIds,
    requestAddFile,
    requestDeleteSelected,
  } = useEntityFiles();
  const isMobile = useIsMobile();

  const allRows = [...primaryRows, ...supportingRows];
  const selectableRows = allRows.filter(isFileRowSelectable);
  const downloadableSelected = allRows.filter(
    row => selectedRowIds.includes(row.rowId) && canDownloadRow(row)
  );
  const selectedSelectableCount = selectableRows.filter(row =>
    selectedRowIds.includes(row.rowId)
  ).length;
  const hasSelection = selectedSelectableCount > 0;

  return (
    <EntityTabFooter highlighted={hasSelection}>
      <FilesToolbar
        totalCount={selectableRows.length}
        selectedCount={selectedSelectableCount}
        downloadCount={downloadableSelected.length}
        showBulkActions={isMobile}
        onAddFile={() => requestAddFile('main')}
        onSelectAll={() => setSelectedRowIds(selectableRows.map(row => row.rowId))}
        onDeselectAll={() => setSelectedRowIds([])}
        onDeleteSelected={requestDeleteSelected}
        onDownloadSelected={() => downloadRows(downloadableSelected, `${entity.sharedId}.zip`)}
      />
    </EntityTabFooter>
  );
};

export { FilesTabFooter };
