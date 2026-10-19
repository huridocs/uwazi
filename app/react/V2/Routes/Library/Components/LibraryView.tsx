import React, { useMemo } from 'react';
import { t } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { LibraryMultiSelectFooter } from './LibraryMultiSelectFooter.js';
import { LibraryResultsFooter } from './LibraryResultsFooter.js';
import { LibraryToolbar } from './LibraryToolbar.js';
import type { LibraryViewProps } from './libraryViewProps.js';
import { uploadChosenLibraryPdfs } from './libraryUploadPdf.js';
import { LibraryViewerHost } from './Viewers/index.js';
import { librarySidePanes } from './LibrarySidePanes.js';
import { useLibraryCardDisplay, useLibraryTableDisplay } from './useLibraryDisplay.js';
import { useLibraryPaneRequest } from './useLibraryMobilePane.js';
import { useLibraryResultsChrome } from './useLibraryResultsChrome.js';
import { useLibraryCreateActions, useLibrarySelectionChrome } from './useLibraryViewChrome.js';
import { useLibraryResultSelection } from './useLibraryResultSelection.js';

const libraryPaneMode = (creating: boolean, selectedCount: number) => {
  if (creating) return 'create';
  if (selectedCount > 0) return 'entity';
  return 'filters';
};

const LibraryView = ({
  rows,
  totalRows,
  aggregations,
  search,
  onSearchChange,
  onSearchSubmit,
  committedSearch,
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
  page = 1,
  limit = 30,
  onPageChange = () => undefined,
  onLimitChange = () => undefined,
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
  const { selectEntity, selectCluster, addEntity, clear } = useLibraryResultSelection({
    orderedIds,
    selectedIds,
    onSelectedIdsChange,
    allowRange: view !== 'map',
  });
  const dismissSelection = () => {
    clear();
    onClosePreview();
  };
  const { selectionPanelOpen, onAction, dialogs, editingSelection, startEdit, stopEdit } =
    useLibrarySelectionChrome({
      selectedIds,
      rows,
      addEntity,
      onDeleted: dismissSelection,
    });
  const {
    focusFieldKey,
    selectRow,
    selectProperty,
    closePreview,
    beginSelection,
    creating,
    openCreate,
    finishCreated,
  } = useLibraryCreateActions(selectEntity, dismissSelection, onEntityCreated);
  const {
    isMobile,
    requestedPane,
    requestPane,
    filtersOpen,
    resultsOpen,
    openFilters,
    openResults,
    closeFilters,
    closeResults,
  } = useLibraryPaneRequest(selectedIds, creating);
  const { confirmedSearch, paneTab, setPaneTab, submitSearch, showResults, clearSearch } =
    useLibraryResultsChrome({
      search,
      committedSearch,
      onSearchChange,
      onSearchSubmit,
      isMobile,
      closeResults,
      closeFilters,
      closePreview,
      openResults,
      clearSelection: clear,
    });

  return (
    <div
      className="h-full min-h-0 bg-warm"
      data-testid="library-v2"
      data-mode={libraryPaneMode(creating, selectedIds.length)}
    >
      <PaneLayout
        defaultRatios={[0.72, 0.28]}
        localStorageKey="library-v2-panes-v2"
        requestedPane={requestedPane}
      >
        <PaneLayout.Pane
          key="results"
          background="var(--color-theme-surface-warm, var(--color-theme-bg-warm))"
        >
          <div className="flex h-full min-h-0 flex-col bg-warm">
            <LibraryToolbar
              search={search}
              onSearchChange={onSearchChange}
              onSearchSubmit={submitSearch}
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
              aria-label={t('System', 'Library results', null, false)}
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
                onClear={dismissSelection}
                onSelectLoaded={() =>
                  onSelectedIdsChange([...new Set([...selectedIds, ...orderedIds])])
                }
                onDeselectLoaded={() => {
                  const loaded = new Set(orderedIds);
                  onSelectedIdsChange(selectedIds.filter(id => !loaded.has(id)));
                }}
                onAction={onAction}
              />
            ) : (
              <LibraryResultsFooter
                onCreateEntity={openCreate}
                onUploadPdf={files => uploadChosenLibraryPdfs(files, finishCreated)}
                onExportCsv={() => onAction('export')}
                onOpenFilters={() => {
                  closePreview();
                  openFilters();
                }}
                onShowResults={showResults}
                page={page}
                limit={limit}
                total={totalRows}
                showPagination={view !== 'map'}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
              />
            )}
          </div>
        </PaneLayout.Pane>
        {librarySidePanes({
          isMobile,
          filtersOpen,
          resultsOpen,
          onFiltersDismiss: () => {
            closeFilters();
            closePreview();
          },
          onResultsDismiss: closeResults,
          requestPane,
          creating,
          rows,
          selectedIds,
          selectionPanelOpen,
          entityBasePath,
          focusFieldKey,
          aggregations,
          filters,
          andFilters,
          chips,
          onFiltersChange,
          onAndFiltersChange,
          onClosePreview: closePreview,
          onCloseSelection: () => {
            stopEdit();
            dismissSelection();
          },
          onRemoveSelection: sharedId =>
            onSelectedIdsChange(selectedIds.filter(id => id !== sharedId)),
          onPreviewSelection: sharedId => selectEntity(sharedId),
          onCreated: finishCreated,
          onAction,
          editingSelection,
          onEditSelection: startEdit,
          onCancelEditSelection: stopEdit,
          search: confirmedSearch,
          paneTab,
          onPaneTabChange: setPaneTab,
          onFocusProperty: selectProperty,
          onSelectResult: selectRow,
          onClearSearch: clearSearch,
        })}
      </PaneLayout>
      {dialogs}
    </div>
  );
};

export type { LibraryViewProps } from './libraryViewProps.js';
export { LibraryView };
