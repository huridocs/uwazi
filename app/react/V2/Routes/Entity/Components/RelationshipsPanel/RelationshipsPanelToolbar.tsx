import React from 'react';
import type { RelationshipsPanelStats } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { RelationshipsListInfoRow } from './RelationshipsListInfoRow.js';
import { RelationshipsSearchBar } from './RelationshipsSearchBar.js';
import { RelationshipsSortControl } from './RelationshipsSortControl.js';

type RelationshipsPanelToolbarProps = {
  stats: RelationshipsPanelStats;
};

const RelationshipsPanelToolbar = ({ stats }: RelationshipsPanelToolbarProps) => (
  <div className="shrink-0 border-b border-border/50">
    <RelationshipsSearchBar />
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2">
      <RelationshipsSortControl />
    </div>
    <RelationshipsListInfoRow stats={stats} />
  </div>
);

export { RelationshipsPanelToolbar };
