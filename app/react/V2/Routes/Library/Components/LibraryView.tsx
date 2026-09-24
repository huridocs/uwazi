import React, { useMemo } from 'react';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryFiltersState, LibrarySortOrder, LibraryViewMode } from '../libraryUrlState.js';
import { LibraryMultiSelectFooter } from './LibraryMultiSelectFooter.js';
import { LibraryResultsFooter } from './LibraryResultsFooter.js';
import { LibraryRightPane } from './LibraryRightPane.js';
import { LibraryToolbar } from './LibraryToolbar.js';
import type { Chip } from './ActiveFiltersSheet.js';
import { LibraryUploadPdfModal } from './LibraryUploadPdfModal.js';
import { LibraryViewerHost } from './Viewers/index.js';
import { useLibraryCardDisplay, useLibraryTableDisplay } from './useLibraryDisplay.js';
import { useLibraryCreateActions, useLibrarySelectionPanel } from './useLibraryViewChrome.js';
import { useLibraryResultSelection } from './useLibraryResultSelection.js';

type LibraryViewProps = {
  rows: LibrarySearchHit[];
  totalRows: number;
  aggregations: LibraryAggregations;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  view: LibraryViewMode;
  onViewChange: (view: LibraryViewMode) => void;
  sort: string;
  order: LibrarySortOrder;
  onSortChange: (sort: string, order: LibrarySortOrder) => void;
  filters: LibraryFiltersState;
  onFiltersChange: (filters: LibraryFiltersState) => void;
  andFilters: string[];
  onAndFiltersChange: (andFilters: string[]) => void;
  chips: Chip[];
  selectedIds?: readonly string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onClosePreview: () => void;
  entityBasePath: string;
  onLoadMore: (amount: number) => void;
  onEntityCreated?: (sharedId?: string) => void;
};

const LibraryView = ({
  rows,
  totalRows,
  aggregations,
  search,
  onSearchChange,
  onSearchSubmit,
  view,
  onViewChange,
  sort,
  order,
  onSortChange,
  filters,
  onFiltersChange,
  andFilters,
  onAndFiltersChange,
  chips,
  selectedIds = [],
  onSelectedIdsChange,
  onClosePreview,
  entityBasePath,
  onLoadMore,
  onEntityCreated,
}: LibraryViewProps) => {
  const {
    showThumbnail,
    showMetadata,
    thumbFrame,
    thumbSize,
    onShowThumbnailChange,
    onShowMetadataChange,
    onThumbFrameChange,
    onThumbSizeChange,
  } = useLibraryCardDisplay();
  const {
    tableColumns,
    tableColumnGroups,
    visibleTableColumns,
    tableDisplay,
    onToggleTableColumn,
    onTableDensityChange,
  } = useLibraryTableDisplay(filters.type ?? []);
  const orderedIds = useMemo(() => rows.map(row => row.sharedId), [rows]);
  const { selectionPanelOpen, notShown, closeSelectionPanel, reopenSelectionPanel } =
    useLibrarySelectionPanel(selectedIds, orderedIds);
  const { selectEntity, selectCluster, clear } = useLibraryResultSelection({
    orderedIds,
    selectedIds,
    onSelectedIdsChange,
    allowRange: view !== 'map',
  });
  const dismissSelection = () => {
    clear();
    onClosePreview();
  };
  const {
    focusFieldKey,
    selectRow,
    selectProperty,
    closePreview,
    beginSelection,
    creating,
    uploadOpen,
    openCreate,
    openUpload,
    closeUpload,
    finishCreated,
  } = useLibraryCreateActions(selectEntity, dismissSelection, onEntityCreated);

  return (
    <div className="h-full min-h-0 bg-warm" data-testid="library-v2">
      <PaneLayout defaultRatios={[0.72, 0.28]} localStorageKey="library-v2-panes-v2">
        <PaneLayout.Pane
          key="results"
          background="var(--color-theme-surface-warm, var(--color-theme-bg-warm))"
        >
          <div className="flex h-full min-h-0 flex-col bg-warm">
            <LibraryToolbar
              search={search}
              onSearchChange={onSearchChange}
              onSearchSubmit={onSearchSubmit}
              view={view}
              onViewChange={onViewChange}
              sort={sort}
              order={order}
              onSortChange={onSortChange}
              totalRows={totalRows}
              showThumbnail={showThumbnail}
              onShowThumbnailChange={onShowThumbnailChange}
              showMetadata={showMetadata}
              onShowMetadataChange={onShowMetadataChange}
              thumbFrame={thumbFrame}
              onThumbFrameChange={onThumbFrameChange}
              thumbSize={thumbSize}
              onThumbSizeChange={onThumbSizeChange}
              tableColumns={tableColumns}
              tableColumnGroups={tableColumnGroups}
              tableDisplay={tableDisplay}
              onToggleTableColumn={onToggleTableColumn}
              onTableDensityChange={onTableDensityChange}
            />
            <div
              className={
                view === 'map'
                  ? 'relative min-h-0 flex-1 overflow-hidden bg-warm'
                  : 'min-h-0 flex-1 overflow-auto bg-warm p-3'
              }
              role="region"
              aria-label="Library results"
            >
              <LibraryViewerHost
                view={view}
                rows={rows}
                totalRows={totalRows}
                selectedIds={selectedIds}
                onSelect={selectRow}
                onSelectCluster={(sharedIds, modifiers) => {
                  beginSelection();
                  selectCluster(sharedIds, modifiers);
                }}
                entityBasePath={entityBasePath}
                onLoadMore={onLoadMore}
                showThumbnail={showThumbnail}
                showMetadata={showMetadata}
                thumbFrame={thumbFrame}
                thumbSize={thumbSize}
                aggregations={aggregations}
                sort={sort}
                order={order}
                onSortChange={onSortChange}
                onFocusProperty={selectProperty}
                tableColumns={visibleTableColumns}
                tableDensity={tableDisplay.density}
              />
            </div>
            {selectedIds.length > 1 ? (
              <LibraryMultiSelectFooter
                count={selectedIds.length}
                loadedIds={orderedIds}
                selectedIds={selectedIds}
                notShown={notShown}
                onClear={dismissSelection}
                onShowList={reopenSelectionPanel}
                onSelectLoaded={() =>
                  onSelectedIdsChange([...new Set([...selectedIds, ...orderedIds])])
                }
                onDeselectLoaded={() => {
                  const loaded = new Set(orderedIds);
                  onSelectedIdsChange(selectedIds.filter(id => !loaded.has(id)));
                }}
              />
            ) : (
              <LibraryResultsFooter onCreateEntity={openCreate} onUploadPdf={openUpload} />
            )}
          </div>
        </PaneLayout.Pane>
        <PaneLayout.Pane key="filters" background="transparent">
          <LibraryRightPane
            creating={creating}
            rows={rows}
            selectedIds={selectedIds}
            selectionPanelOpen={selectionPanelOpen}
            entityBasePath={entityBasePath}
            focusFieldKey={focusFieldKey}
            aggregations={aggregations}
            filters={filters}
            andFilters={andFilters}
            chips={chips}
            onFiltersChange={onFiltersChange}
            onAndFiltersChange={onAndFiltersChange}
            onClosePreview={closePreview}
            onCloseSelection={closeSelectionPanel}
            onRemoveSelection={sharedId =>
              onSelectedIdsChange(selectedIds.filter(id => id !== sharedId))
            }
            onPreviewSelection={sharedId => selectEntity(sharedId)}
            onCreated={finishCreated}
          />
        </PaneLayout.Pane>
      </PaneLayout>
      {uploadOpen ? (
        <LibraryUploadPdfModal onClose={closeUpload} onUploaded={finishCreated} />
      ) : null}
    </div>
  );
};

export type { LibraryViewProps };
export { LibraryView };
