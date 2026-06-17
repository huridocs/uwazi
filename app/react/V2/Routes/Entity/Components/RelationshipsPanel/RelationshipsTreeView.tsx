import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  buildPanelListEntries,
  panelEntryKey,
} from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipPanelRow, type RelationshipPanelRowHandlers } from './RelationshipPanelRow.js';
import { RelationshipsTreeNode, getTreeLine } from './RelationshipsTreeBranch.js';
import { RelationshipsEmptyView } from './RelationshipsEmptyView.js';
import { RelationshipsGroupedSections } from './RelationshipsGroupedSections.js';
import { useRelationshipsGroupBy } from './useRelationshipsGroupBy.js';

type RelationshipsTreeViewProps = RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
};

const RelationshipsTreeView = ({
  markers,
  groupContext,
  selfSharedId,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
}: RelationshipsTreeViewProps) => {
  const { groupBy, subGroupBy } = useRelationshipsGroupBy();
  const rowProps = { selfSharedId, activeRelationshipId, onClick, onView, onDelete };

  if (markers.length === 0) {
    return (
      <RelationshipsEmptyView>
        <Translate>No relationships found</Translate>
      </RelationshipsEmptyView>
    );
  }

  if (groupBy === 'none') {
    const entries = buildPanelListEntries(markers, selfSharedId);
    return (
      <div className="py-3">
        {entries.map((entry, index) => (
          <RelationshipsTreeNode
            key={panelEntryKey(entry)}
            treeLine={getTreeLine(index, entries.length)}
          >
            <RelationshipPanelRow entry={entry} {...rowProps} />
          </RelationshipsTreeNode>
        ))}
      </div>
    );
  }

  return (
    <div className="py-3">
      <RelationshipsGroupedSections
        markers={markers}
        groupContext={groupContext}
        groupBy={groupBy}
        subGroupBy={subGroupBy}
        variant="tree"
        {...rowProps}
      />
    </div>
  );
};

export { RelationshipsTreeView };
