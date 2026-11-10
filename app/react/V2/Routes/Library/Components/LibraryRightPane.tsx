import React, { type ReactElement } from 'react';
import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryFiltersState } from '../libraryUrlState.js';
import type { Chip } from './ActiveFiltersSheet.js';
import { LibraryCreateEntityPanel } from './LibraryCreateEntityPanel.js';
import { LibraryEntityPreview } from './LibraryEntityPreview.js';
import { LibraryFilters } from './LibraryFilters.js';
import { LibrarySideTabs } from './LibrarySideTabs.js';
import { LibraryResultsPanel } from './LibraryResultsPanel.js';
import { LibrarySelectionPanel } from './LibrarySelectionPanel.js';
import { libraryResultViews } from './libraryResultSnippets.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';

type LibraryRightPaneProps = {
  creating: boolean;
  rows: LibrarySearchHit[];
  selectedIds: readonly string[];
  selectionPanelOpen: boolean;
  entityBasePath: string;
  focusFieldKey?: string;
  aggregations: LibraryAggregations;
  filters: LibraryFiltersState;
  andFilters: string[];
  chips: Chip[];
  onFiltersChange: (filters: LibraryFiltersState) => void;
  onAndFiltersChange: (andFilters: string[]) => void;
  onClosePreview: () => void;
  onCloseSelection: () => void;
  onRemoveSelection: (sharedId: string) => void;
  onPreviewSelection: (sharedId: string) => void;
  onCreated: (sharedId?: string) => void;
  onAction?: (action: LibraryBulkAction) => void;
  editingSelection?: boolean;
  onEditSelection?: () => void;
  onCancelEditSelection?: () => void;
  search: string;
  paneTab: 'filters' | 'results';
  onPaneTabChange: (tab: 'filters' | 'results') => void;
  onFocusProperty: (sharedId: string, fieldKey: string) => void;
  onSelectResult: (sharedId: string) => void;
  onClearSearch: () => void;
  isMobile?: boolean;
};

const libraryPaneOverlay = ({
  creating,
  onClosePreview,
  onCreated,
  selectedIds,
  selectionPanelOpen,
  rows,
  entityBasePath,
  onCloseSelection,
  onRemoveSelection,
  onPreviewSelection,
  onAction,
  editingSelection = false,
  onEditSelection,
  onCancelEditSelection,
  focusFieldKey,
}: LibraryRightPaneProps): ReactElement | null => {
  if (creating) {
    return <LibraryCreateEntityPanel onClose={onClosePreview} onCreated={onCreated} />;
  }
  if (selectedIds.length > 1 && selectionPanelOpen) {
    return (
      <LibrarySelectionPanel
        rows={rows}
        selectedIds={selectedIds}
        entityBasePath={entityBasePath}
        onClose={onCloseSelection}
        onRemove={onRemoveSelection}
        onPreview={onPreviewSelection}
        onAction={onAction}
        editing={editingSelection}
        onEdit={onEditSelection}
        onCancelEdit={onCancelEditSelection}
      />
    );
  }
  const [selectedId] = selectedIds.length === 1 ? selectedIds : [];
  if (!selectedId) {
    return null;
  }
  return (
    <LibraryEntityPreview
      key={selectedId}
      sharedId={selectedId}
      entityBasePath={entityBasePath}
      onClose={onClosePreview}
      onAction={onAction}
      focusFieldKey={focusFieldKey}
    />
  );
};

const librarySideChrome = ({
  search,
  rows,
  paneTab,
  onPaneTabChange,
  chips,
  onFocusProperty,
  onSelectResult,
  onClearSearch,
  aggregations,
  filters,
  andFilters,
  onFiltersChange,
  onAndFiltersChange,
}: LibraryRightPaneProps) => {
  const hasResults = Boolean(search.trim()) && libraryResultViews(rows).length > 0;
  return (
    <>
      <LibrarySideTabs
        activeId={paneTab}
        onChange={onPaneTabChange}
        filtersDot={chips.length > 0}
        resultsDot={hasResults}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        {paneTab === 'results' ? (
          <LibraryResultsPanel
            search={search}
            rows={rows}
            onFocusProperty={onFocusProperty}
            onSelect={onSelectResult}
            onClearSearch={onClearSearch}
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
      </div>
    </>
  );
};

const LibraryRightPane = (props: LibraryRightPaneProps) => {
  const overlay = libraryPaneOverlay(props);
  const chrome = (
    <div
      hidden={!props.isMobile && overlay !== null}
      className="flex h-full min-h-0 flex-col bg-warm"
    >
      {librarySideChrome(props)}
    </div>
  );
  // On a phone the results list lives in its own sheet, so the preview pane replaces it.
  // On desktop the list stays mounted behind the preview and keeps its filters, layout and scroll.
  if (props.isMobile) {
    return overlay ?? chrome;
  }
  return (
    <div className="h-full min-h-0">
      {chrome}
      {overlay}
    </div>
  );
};

export type { LibraryRightPaneProps };
export { LibraryRightPane };
