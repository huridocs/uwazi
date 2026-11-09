import React from 'react';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { useTabGroup } from '#V2/Components/UI/Tabs/useTabGroup.js';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { SIDE_TAB } from '../tabIds.js';
import { FilesToolbar } from '../../Components/Files/FilesToolbar.js';
import { isFileRowSelectable } from '../../Components/Files/fileHelpers.js';
import { canDownloadRow, downloadRows } from './FileDownloadButton.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

const toolbarShowsBulkActions = (
  isMobile: boolean | undefined,
  selectedCount: number,
  sideTabId: string | undefined
) => isMobile !== false || selectedCount < 2 || sideTabId !== SIDE_TAB.FILE;

type FilesTabFooterProps = {
  inset?: 'side' | 'main';
};

const FilesTabFooter = ({ inset = 'main' }: FilesTabFooterProps) => {
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
  const { activeTabId } = useTabGroup('entity-side');

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
    <EntityTabFooter highlighted={hasSelection} inset={inset}>
      <FilesToolbar
        totalCount={selectableRows.length}
        selectedCount={selectedSelectableCount}
        downloadCount={downloadableSelected.length}
        showBulkActions={toolbarShowsBulkActions(isMobile, selectedSelectableCount, activeTabId)}
        onAddFile={() => requestAddFile('main')}
        onSelectAll={() => setSelectedRowIds(selectableRows.map(row => row.rowId))}
        onDeselectAll={() => setSelectedRowIds([])}
        onDeleteSelected={requestDeleteSelected}
        onDownloadSelected={() => {
          void downloadRows(downloadableSelected, `${entity.sharedId}.zip`);
        }}
      />
    </EntityTabFooter>
  );
};

export { FilesTabFooter, toolbarShowsBulkActions };
