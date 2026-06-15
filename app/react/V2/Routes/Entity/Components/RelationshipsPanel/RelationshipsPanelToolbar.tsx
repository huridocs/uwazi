import React from 'react';
import { useAtomValue } from 'jotai';
import type { RelationshipsPanelStats } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import {
  relationshipsPanelActiveFilterCountAtom,
  relationshipsPanelViewAtom,
} from './relationshipsPanelFiltersAtom.js';
import { RelationshipsListInfoRow } from './RelationshipsListInfoRow.js';
import { RelationshipsPanelToolbarControls } from './RelationshipsPanelToolbarControls.js';
import { RelationshipsSearchBar } from './RelationshipsSearchBar.js';

type RelationshipsPanelToolbarProps = {
  stats: RelationshipsPanelStats;
  onOpenFilters: () => void;
};

const RelationshipsPanelToolbar = ({ stats, onOpenFilters }: RelationshipsPanelToolbarProps) => {
  const view = useAtomValue(relationshipsPanelViewAtom);
  const activeFilterCount = useAtomValue(relationshipsPanelActiveFilterCountAtom);

  return (
    <div className="shrink-0 border-b border-border/50">
      <RelationshipsSearchBar />
      <div className="w-full pb-2">
        <RelationshipsPanelToolbarControls
          activeFilterCount={activeFilterCount}
          onOpenFilters={onOpenFilters}
        />
      </div>
      {view !== 'graph' && <RelationshipsListInfoRow stats={stats} />}
    </div>
  );
};

export { RelationshipsPanelToolbar };
