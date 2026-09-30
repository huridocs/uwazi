import React, { useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryFiltersState, LibrarySortOrder, LibraryViewMode } from '../libraryUrlState.js';
import { LibraryResultsFooter } from './LibraryResultsFooter.js';
import { LibraryToolbar } from './LibraryToolbar.js';
import type { Chip } from './ActiveFiltersSheet.js';
import { LibraryUploadPdfModal } from './LibraryUploadPdfModal.js';
import { LibraryViewerHost } from './Viewers/index.js';
import { librarySidePanes } from './LibrarySidePanes.js';
import { useLibraryMobilePane } from './useLibraryMobilePane.js';
import { useLibraryCreateActions, useLibraryTableDisplay } from './libraryViewActions.js';
import { DEFAULT_THUMB_FRAME } from './libraryCardDisplay.js';

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
  selectedId?: string;
  onSelect: (sharedId: string) => void;
  onClosePreview: () => void;
  entityBasePath: string;
  onLoadMore: (amount: number) => void;
  onEntityCreated?: (sharedId?: string) => void;
};

const libraryPaneMode = (creating: boolean, selectedId?: string) => {
  if (creating) return 'create';
  if (selectedId) return 'entity';
  return 'filters';
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
  selectedId,
  onSelect,
  onClosePreview,
  entityBasePath,
  onLoadMore,
  onEntityCreated,
}: LibraryViewProps) => {
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  const [thumbFrame, setThumbFrame] = useState(DEFAULT_THUMB_FRAME);
  const {
    tableColumns,
    tableColumnGroups,
    visibleTableColumns,
    tableDisplay,
    onToggleTableColumn,
    onTableDensityChange,
  } = useLibraryTableDisplay(filters.type ?? []);
  const {
    focusFieldKey,
    selectRow,
    selectProperty,
    closePreview,
    creating,
    uploadOpen,
    openCreate,
    openUpload,
    closeUpload,
    finishCreated,
  } = useLibraryCreateActions(onSelect, onClosePreview, onEntityCreated);
  const isMobile = useIsMobile() === true;
  const { requestedPane, requestPane, filtersOpen, entityPane, openFilters, closeFilters } =
    useLibraryMobilePane(selectedId, creating, isMobile);

  return (
    <div
      className="h-full min-h-0 bg-warm"
      data-testid="library-v2"
      data-mode={libraryPaneMode(creating, selectedId)}
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
              onShowThumbnailChange={setShowThumbnail}
              showMetadata={showMetadata}
              onShowMetadataChange={setShowMetadata}
              thumbFrame={thumbFrame}
              onThumbFrameChange={setThumbFrame}
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
              aria-label="Library results"
            >
              <LibraryViewerHost
                view={view}
                rows={rows}
                totalRows={totalRows}
                selectedId={selectedId}
                onSelect={sharedId => {
                  selectRow(sharedId);
                  requestPane(entityPane);
                }}
                entityBasePath={entityBasePath}
                onLoadMore={onLoadMore}
                showThumbnail={showThumbnail}
                showMetadata={showMetadata}
                thumbFrame={thumbFrame}
                aggregations={aggregations}
                sort={sort}
                order={order}
                onSortChange={onSortChange}
                onFocusProperty={(sharedId, fieldKey) => {
                  selectProperty(sharedId, fieldKey);
                  requestPane(entityPane);
                }}
                tableColumns={visibleTableColumns}
                tableDensity={tableDisplay.density}
              />
            </div>
            <LibraryResultsFooter
              onCreateEntity={() => {
                openCreate();
                requestPane(entityPane);
              }}
              onUploadPdf={openUpload}
            />
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
          selectedId,
          entityBasePath,
          focusFieldKey,
          aggregations,
          filters,
          andFilters,
          chips,
          onFiltersChange,
          onAndFiltersChange,
          onClosePreview: closePreview,
          onCreated: finishCreated,
        })}
      </PaneLayout>
      {uploadOpen ? (
        <LibraryUploadPdfModal onClose={closeUpload} onUploaded={finishCreated} />
      ) : null}
    </div>
  );
};

export type { LibraryViewProps };
export { LibraryView };
