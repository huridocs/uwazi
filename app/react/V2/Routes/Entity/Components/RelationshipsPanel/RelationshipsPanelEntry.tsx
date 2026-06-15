import React from 'react';
import type { PanelListEntry } from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { RelationshipRow } from './RelationshipRow.js';
import { RelationshipAggregateRow } from './RelationshipAggregateRow.js';
import { RelationshipHubRow } from './RelationshipHubRow.js';

type RelationshipsPanelEntryProps = {
  entry: PanelListEntry;
  selfSharedId: string;
  activeRelationshipId?: string;
  onClick: (marker: RelationshipMarker) => void;
  onView: (marker: RelationshipMarker) => void;
  onDelete: (marker: RelationshipMarker) => void;
};

const RelationshipsPanelEntry = ({
  entry,
  selfSharedId,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
}: RelationshipsPanelEntryProps) => {
  if (entry.kind === 'reference') {
    return (
      <RelationshipRow
        marker={entry.marker}
        selfSharedId={selfSharedId}
        isSelected={activeRelationshipId === entry.marker._id}
        onClick={() => onClick(entry.marker)}
        onView={() => onView(entry.marker)}
        onDelete={() => onDelete(entry.marker)}
      />
    );
  }
  if (entry.kind === 'aggregate') {
    return (
      <RelationshipAggregateRow
        aggregate={entry.aggregate}
        markers={entry.markers}
        selfSharedId={selfSharedId}
        activeRelationshipId={activeRelationshipId}
        onClick={onClick}
        onView={onView}
        onDelete={onDelete}
      />
    );
  }
  return (
    <RelationshipHubRow
      hub={entry.hub}
      markers={entry.markers}
      selfSharedId={selfSharedId}
      activeRelationshipId={activeRelationshipId}
      onClick={onClick}
      onView={onView}
      onDelete={onDelete}
    />
  );
};

export { RelationshipsPanelEntry };
