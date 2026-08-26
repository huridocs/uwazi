import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { FolderIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { BlankState } from '#V2/Components/UI/BlankState.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryFiltersState, LibrarySortOrder, LibraryViewMode } from '../libraryUrlState.js';
import { EntityCard } from './EntityCard.js';
import { metadataFieldsForCard, thumbnailFromEntity } from './cardModel.js';
import { LibraryFilters } from './LibraryFilters.js';
import { LibraryResultsFooter } from './LibraryResultsFooter.js';
import { LibraryToolbar } from './LibraryToolbar.js';
import type { Chip } from './ActiveFiltersSheet.js';
import { LoadMore } from './LoadMore.js';

type LibraryViewProps = {
  rows: LibrarySearchHit[];
  totalRows: number;
  aggregations: LibraryAggregations;
  search: string;
  onSearchChange: (value: string) => void;
  view: LibraryViewMode;
  onViewChange: (view: LibraryViewMode) => void;
  sort: string;
  order: LibrarySortOrder;
  onSortChange: (sort: string, order: LibrarySortOrder) => void;
  filters: LibraryFiltersState;
  onFiltersChange: (filters: LibraryFiltersState) => void;
  chips: Chip[];
  selectedId?: string;
  onSelect: (sharedId: string) => void;
  entityBasePath: string;
  onLoadMore: (amount: number) => void;
};

const LibraryView = ({
  rows,
  totalRows,
  aggregations,
  search,
  onSearchChange,
  view,
  onViewChange,
  sort,
  order,
  onSortChange,
  filters,
  onFiltersChange,
  chips,
  selectedId,
  onSelect,
  entityBasePath,
  onLoadMore,
}: LibraryViewProps) => {
  const templates = useAtomValue(templatesAtom);
  const templateById = new Map(templates.map(template => [template._id, template]));
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
              {rows.length === 0 ? (
                <BlankState
                  icon={<FolderIcon className="h-8 w-8 text-ink-muted" />}
                  title={<Translate>No entities found</Translate>}
                  description={<Translate>Try a different search or clear filters.</Translate>}
                />
              ) : (
                <>
                  <div
                    className={
                      view === 'list'
                        ? 'flex flex-col gap-1.5'
                        : 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'
                    }
                  >
                    {rows.map(entity => {
                      const cardEntity = entity as Entity;
                      const thumbnail = thumbnailFromEntity(cardEntity);
                      return (
                        <EntityCard
                          key={entity.sharedId}
                          title={entity.title}
                          templateId={entity.template}
                          fields={metadataFieldsForCard(
                            cardEntity,
                            templateById.get(entity.template)
                          )}
                          thumbnailSrc={thumbnail.src}
                          thumbnailKind={thumbnail.kind}
                          layout={view}
                          showThumbnail={showThumbnail}
                          showMetadata={showMetadata}
                          selected={selectedId === entity.sharedId}
                          onSelect={() => onSelect(entity.sharedId)}
                          viewHref={`${entityBasePath}/${entity.sharedId}`}
                        />
                      );
                    })}
                  </div>
                  <LoadMore loaded={rows.length} total={totalRows} onLoadMore={onLoadMore} />
                </>
              )}
            </div>
            <LibraryResultsFooter />
          </div>
        </PaneLayout.Pane>
        <PaneLayout.Pane key="filters" background="transparent">
          <LibraryFilters
            aggregations={aggregations}
            filters={filters}
            onChange={onFiltersChange}
            chips={chips}
          />
        </PaneLayout.Pane>
      </PaneLayout>
    </div>
  );
};

export type { LibraryViewProps };
export { LibraryView };
