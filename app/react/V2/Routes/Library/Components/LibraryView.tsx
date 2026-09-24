import React, { useMemo, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryFiltersState, LibrarySortOrder, LibraryViewMode } from '../libraryUrlState.js';
import { LibraryFilters } from './LibraryFilters.js';
import { LibraryResultsFooter } from './LibraryResultsFooter.js';
import { LibraryToolbar } from './LibraryToolbar.js';
import type { Chip } from './ActiveFiltersSheet.js';
import { LibraryEntityPreview } from './LibraryEntityPreview.js';
import { LibraryCreateEntityPanel } from './LibraryCreateEntityPanel.js';
import { LibraryUploadPdfModal } from './LibraryUploadPdfModal.js';
import { LibraryViewerHost } from './Viewers/index.js';
import { libraryTableDisplayAtom } from './libraryTableDisplayAtom.js';
import { DEFAULT_THUMB_FRAME, DEFAULT_THUMB_SIZE } from './libraryCardDisplay.js';
import {
  visibleLibraryTableColumns,
  libraryTableColumnGroups,
  libraryTableColumns,
  toggleColumnVisibility,
  type LibraryTableDensity,
} from './libraryTableColumns.js';

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

const useLibraryTableDisplay = (selectedTemplateIds: string[]) => {
  const templates = useAtomValue(templatesAtom);
  const [tableDisplay, setTableDisplay] = useAtom(libraryTableDisplayAtom);
  const tableColumnGroups = useMemo(
    () => libraryTableColumnGroups(templates, selectedTemplateIds),
    [selectedTemplateIds, templates]
  );
  const tableColumns = useMemo(
    () => libraryTableColumns(templates, selectedTemplateIds),
    [selectedTemplateIds, templates]
  );
  const visibleTableColumns = useMemo(
    () => visibleLibraryTableColumns(tableColumns, tableDisplay),
    [tableColumns, tableDisplay]
  );

  return {
    tableColumns,
    tableColumnGroups,
    visibleTableColumns,
    tableDisplay,
    onToggleTableColumn: (id: string) =>
      setTableDisplay(current => toggleColumnVisibility(id, current)),
    onTableDensityChange: (density: LibraryTableDensity) =>
      setTableDisplay(current => ({ ...current, density })),
  };
};

const useLibraryPreviewFocus = (
  onSelect: (sharedId: string) => void,
  onClosePreview: () => void
) => {
  const [focusFieldKey, setFocusFieldKey] = useState<string>();
  return {
    focusFieldKey,
    selectRow: (sharedId: string) => {
      setFocusFieldKey(undefined);
      onSelect(sharedId);
    },
    selectProperty: (sharedId: string, fieldKey: string) => {
      setFocusFieldKey(fieldKey);
      onSelect(sharedId);
    },
    closePreview: () => {
      setFocusFieldKey(undefined);
      onClosePreview();
    },
  };
};

const useLibraryCreateActions = (
  onSelect: (sharedId: string) => void,
  onClosePreview: () => void,
  onEntityCreated?: (sharedId?: string) => void
) => {
  const [creating, setCreating] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const preview = useLibraryPreviewFocus(
    sharedId => {
      setCreating(false);
      onSelect(sharedId);
    },
    () => {
      setCreating(false);
      onClosePreview();
    }
  );
  return {
    ...preview,
    creating,
    uploadOpen,
    openCreate: () => {
      preview.closePreview();
      setCreating(true);
    },
    openUpload: () => setUploadOpen(true),
    closeUpload: () => setUploadOpen(false),
    finishCreated: (sharedId?: string) => {
      setCreating(false);
      setUploadOpen(false);
      onEntityCreated?.(sharedId);
      if (sharedId) {
        preview.selectRow(sharedId);
      }
    },
  };
};

type LibraryRightPaneProps = {
  creating: boolean;
  selectedId?: string;
  entityBasePath: string;
  focusFieldKey?: string;
  aggregations: LibraryAggregations;
  filters: LibraryFiltersState;
  andFilters: string[];
  chips: Chip[];
  onFiltersChange: (filters: LibraryFiltersState) => void;
  onAndFiltersChange: (andFilters: string[]) => void;
  onClosePreview: () => void;
  onCreated: (sharedId?: string) => void;
};

const renderLibraryRightPane = ({
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
  onClosePreview,
  onCreated,
}: LibraryRightPaneProps) => {
  if (creating) {
    return <LibraryCreateEntityPanel onClose={onClosePreview} onCreated={onCreated} />;
  }
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
  const [thumbSize, setThumbSize] = useState(DEFAULT_THUMB_SIZE);
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
              thumbFrame={thumbFrame}
              onThumbFrameChange={setThumbFrame}
              thumbSize={thumbSize}
              onThumbSizeChange={setThumbSize}
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
                selectedId={selectedId}
                onSelect={selectRow}
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
            <LibraryResultsFooter onCreateEntity={openCreate} onUploadPdf={openUpload} />
          </div>
        </PaneLayout.Pane>
        <PaneLayout.Pane key="filters" background="transparent">
          {renderLibraryRightPane({
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
