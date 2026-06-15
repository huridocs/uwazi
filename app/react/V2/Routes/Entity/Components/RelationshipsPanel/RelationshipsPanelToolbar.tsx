import React from 'react';
import { useAtomValue } from 'jotai';
import type { RelationshipsPanelStats } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import {
  relationshipsPanelGroupByAtom,
  relationshipsPanelActiveFilterCountAtom,
  relationshipsPanelViewAtom,
} from './relationshipsPanelFiltersAtom.js';
import { RelationshipsListInfoRow } from './RelationshipsListInfoRow.js';
import { RelationshipsSearchBar } from './RelationshipsSearchBar.js';
import { RelationshipsSortControl } from './RelationshipsSortControl.js';
import { RelationshipsGroupByControl } from './RelationshipsGroupByControl.js';
import { RelationshipsViewControls } from './RelationshipsViewControls.js';
import { RelationshipsZoomControl } from './RelationshipsZoomControl.js';
import { RelationshipsFiltersButton } from './RelationshipsFiltersButton.js';

type RelationshipsPanelToolbarProps = {
  stats: RelationshipsPanelStats;
  onOpenFilters: () => void;
};

const RelationshipsPanelToolbar = ({ stats, onOpenFilters }: RelationshipsPanelToolbarProps) => {
  const groupBy = useAtomValue(relationshipsPanelGroupByAtom);
  const view = useAtomValue(relationshipsPanelViewAtom);
  const activeFilterCount = useAtomValue(relationshipsPanelActiveFilterCountAtom);
  const zoomDisabled = view === 'graph' || (view === 'list' && groupBy === 'none');

  return (
    <div className="shrink-0 border-b border-border/50">
      <RelationshipsSearchBar />
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <RelationshipsViewControls />
          <RelationshipsZoomControl disabled={zoomDisabled} />
          <RelationshipsGroupByControl axis="primary" />
          <RelationshipsGroupByControl
            axis="secondary"
            disabled={groupBy === 'none'}
            excludeOption={groupBy !== 'none' ? groupBy : undefined}
          />
          <RelationshipsSortControl />
        </div>
        <RelationshipsFiltersButton activeCount={activeFilterCount} onClick={onOpenFilters} />
      </div>
      {view !== 'graph' && <RelationshipsListInfoRow stats={stats} />}
    </div>
  );
};

export { RelationshipsPanelToolbar };
