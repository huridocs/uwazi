import React from 'react';
import {
  buildPanelListEntries,
  panelEntryKey,
} from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { RelationshipPanelRow, type RelationshipPanelRowHandlers } from './RelationshipPanelRow.js';
import { RelationshipsTreeNode, getTreeLine } from './RelationshipsTreeBranch.js';

type RelationshipsPanelEntryListProps = RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  bordered?: boolean;
  variant?: 'list' | 'tree';
};

const panelEntryCount = (markers: RelationshipMarker[], selfSharedId: string): number =>
  buildPanelListEntries(markers, selfSharedId).length;

const RelationshipsPanelEntryList = ({
  markers,
  groupContext,
  selfSharedId,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
  bordered = false,
  variant = 'list',
}: RelationshipsPanelEntryListProps) => {
  const entries = buildPanelListEntries(markers, selfSharedId);
  const rowProps = { selfSharedId, activeRelationshipId, onClick, onView, onDelete };

  const content = entries.map((entry, index) => {
    const row = <RelationshipPanelRow entry={entry} groupContext={groupContext} {...rowProps} />;

    if (variant === 'tree') {
      return (
        <RelationshipsTreeNode
          key={panelEntryKey(entry)}
          treeLine={getTreeLine(index, entries.length)}
        >
          {row}
        </RelationshipsTreeNode>
      );
    }

    return <React.Fragment key={panelEntryKey(entry)}>{row}</React.Fragment>;
  });

  if (bordered) {
    return (
      <div className="overflow-hidden rounded-md border border-border/60 bg-paper">{content}</div>
    );
  }

  if (variant === 'tree') {
    return <div className="py-3">{content}</div>;
  }

  return <>{content}</>;
};

export { panelEntryCount, RelationshipsPanelEntryList };
