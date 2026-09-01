import React, { useState } from 'react';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryFiltersState, LibrarySortOrder, LibraryViewMode } from '../libraryUrlState.js';
import { LibraryFilters } from './LibraryFilters.js';
import { LibraryResultsFooter } from './LibraryResultsFooter.js';
import { LibraryToolbar } from './LibraryToolbar.js';
import type { Chip } from './ActiveFiltersSheet.js';
import { LibraryEntityPreview } from './LibraryEntityPreview.js';
import { LibraryViewerHost } from './Viewers/index.js';

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
}: LibraryViewProps) => {
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);

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
              onShowThumbnailChange={setShowThumbnail}
              showMetadata={showMetadata}
              onShowMetadataChange={setShowMetadata}
            />
            <div
              className="min-h-0 flex-1 overflow-auto bg-warm p-3"
              role="region"
              aria-label="Library results"
            >
              <LibraryViewerHost
                view={view}
                rows={rows}
                totalRows={totalRows}
                selectedId={selectedId}
                onSelect={onSelect}
                entityBasePath={entityBasePath}
                onLoadMore={onLoadMore}
                showThumbnail={showThumbnail}
                showMetadata={showMetadata}
              />
            </div>
            <LibraryResultsFooter />
          </div>
        </PaneLayout.Pane>
        <PaneLayout.Pane key="filters" background="transparent">
          {selectedId ? (
            <LibraryEntityPreview
              key={selectedId}
              sharedId={selectedId}
              entityBasePath={entityBasePath}
              onClose={onClosePreview}
            />
          ) : (
            <LibraryFilters
              aggregations={aggregations}
              filters={filters}
              andFilters={andFilters}
              onChange={onFiltersChange}
              onAndFiltersChange={onAndFiltersChange}
              chips={chips}
            />
          )}
        </PaneLayout.Pane>
      </PaneLayout>
    </div>
  );
};

export type { LibraryViewProps };
export { LibraryView };
