import React from 'react';
import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryFiltersState } from '../libraryUrlState.js';
import type { Chip } from './ActiveFiltersSheet.js';
import { LibraryCreateEntityPanel } from './LibraryCreateEntityPanel.js';
import { LibraryEntityPreview } from './LibraryEntityPreview.js';
import { LibraryFilters } from './LibraryFilters.js';
import { LibrarySelectionPanel } from './LibrarySelectionPanel.js';
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
        focusFieldKey={focusFieldKey}
      />
    );
  }
  return (
    <LibraryFilters
      aggregations={aggregations}
      filters={filters}
      andFilters={andFilters}
      onChange={onFiltersChange}
      onAndFiltersChange={onAndFiltersChange}
      chips={chips}
    />
  );
};

export type { LibraryRightPaneProps };
export { LibraryRightPane };
