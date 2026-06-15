import React from 'react';
import { useAtomValue } from 'jotai';
import type { RelationshipsPanelStats } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { relationshipsPanelGroupByAtom } from './relationshipsPanelFiltersAtom.js';
import { RelationshipsListInfoRow } from './RelationshipsListInfoRow.js';
import { RelationshipsSearchBar } from './RelationshipsSearchBar.js';
import { RelationshipsSortControl } from './RelationshipsSortControl.js';
import { RelationshipsGroupByControl } from './RelationshipsGroupByControl.js';

type RelationshipsPanelToolbarProps = {
  stats: RelationshipsPanelStats;
};

const RelationshipsPanelToolbar = ({ stats }: RelationshipsPanelToolbarProps) => {
  const groupBy = useAtomValue(relationshipsPanelGroupByAtom);

  return (
    <div className="shrink-0 border-b border-border/50">
      <RelationshipsSearchBar />
      <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
        <RelationshipsGroupByControl axis="primary" />
        <RelationshipsGroupByControl
          axis="secondary"
          disabled={groupBy === 'none'}
          excludeOption={groupBy !== 'none' ? groupBy : undefined}
        />
        <RelationshipsSortControl />
      </div>
      <RelationshipsListInfoRow stats={stats} />
    </div>
  );
};

export { RelationshipsPanelToolbar };
