import React, { useMemo } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { notify } from '#V2/utils/notifyBridge.js';
import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryFiltersState, LibrarySortOrder, LibraryViewMode } from '../libraryUrlState.js';
import { LibraryMultiSelectFooter } from './LibraryMultiSelectFooter.js';
import { LibraryResultsFooter } from './LibraryResultsFooter.js';
import { LibraryToolbar } from './LibraryToolbar.js';
import type { Chip } from './ActiveFiltersSheet.js';
import { pdfFilesFromList, uploadPdfsAndCreateEntities } from './libraryUploadPdf.js';
import { LibraryViewerHost } from './Viewers/index.js';
import { librarySidePanes } from './LibrarySidePanes.js';
import { useLibraryCardDisplay, useLibraryTableDisplay } from './useLibraryDisplay.js';
import { useLibraryPaneRequest } from './useLibraryMobilePane.js';
import { useLibraryCreateActions, useLibrarySelectionChrome } from './useLibraryViewChrome.js';
import { useLibraryResultSelection } from './useLibraryResultSelection.js';

const libraryPaneMode = (creating: boolean, selectedCount: number) => {
  if (creating) return 'create';
  if (selectedCount > 0) return 'entity';
  return 'filters';
};

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
  const { selectionPanelOpen, onAction, dialogs } = useLibrarySelectionChrome({
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
  const { isMobile, requestedPane, requestPane, filtersOpen, openFilters, closeFilters } =
    useLibraryPaneRequest(selectedIds, creating);
  const uploadChosenPdfs = (files: File[]) => {
    const pdfs = pdfFilesFromList(files);
    if (!pdfs.length) {
      return;
    }
    void uploadPdfsAndCreateEntities(
      pdfs,
      () => undefined,
      () => undefined
    )
      .then(created => {
        finishCreated(created.at(-1)?.sharedId);
      })
      .catch((caught: unknown) => {
        notify(caught instanceof Error ? caught.message : String(caught), 'error');
      });
  };

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
            {isMobile ? (
              <button
                type="button"
                onClick={() => {
                  closePreview();
                  openFilters();
                }}
                className="mx-3 mb-1 inline-flex h-7 items-center self-start rounded-md bg-vellum px-3 text-[13px] font-semibold text-ink md:hidden"
              >
                <Translate>Filters</Translate>
              </button>
            ) : null}
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
                onUploadPdf={uploadChosenPdfs}
                onExportCsv={() => onAction('export')}
              />
            )}
          </div>
        </PaneLayout.Pane>
        {librarySidePanes({
          isMobile,
          filtersOpen,
          onFiltersDismiss: () => {
            closeFilters();
            closePreview();
          },
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
          onCloseSelection: dismissSelection,
          onRemoveSelection: sharedId =>
            onSelectedIdsChange(selectedIds.filter(id => id !== sharedId)),
          onPreviewSelection: sharedId => selectEntity(sharedId),
          onCreated: finishCreated,
          onAction,
        })}
      </PaneLayout>
      {dialogs}
    </div>
  );
};

export type { LibraryViewProps };
export { LibraryView };
