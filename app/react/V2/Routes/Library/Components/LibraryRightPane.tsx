import React from 'react';
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
};

const LibraryRightPane = ({
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
  onClosePreview,
  onCloseSelection,
  onRemoveSelection,
  onPreviewSelection,
  onCreated,
  onAction,
  editingSelection = false,
  onEditSelection,
  onCancelEditSelection,
  search,
  paneTab,
  onPaneTabChange,
  onFocusProperty,
  onSelectResult,
  onClearSearch,
}: LibraryRightPaneProps) => {
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
  if (selectedId) {
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
  }
  const hasResults = Boolean(search.trim()) && libraryResultViews(rows).length > 0;
  return (
    <div className="flex h-full min-h-0 flex-col bg-warm">
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
    </div>
  );
};

export type { LibraryRightPaneProps };
export { LibraryRightPane };
