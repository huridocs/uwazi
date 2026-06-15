import React from 'react';
import {
  buildPanelListEntries,
  panelEntryKey,
} from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { RelationshipsPanelEntry } from './RelationshipsPanelEntry.js';

type RelationshipsPanelEntriesProps = {
  markers: RelationshipMarker[];
  selfSharedId: string;
  activeRelationshipId?: string;
  onClick: (marker: RelationshipMarker) => void;
  onView: (marker: RelationshipMarker) => void;
  onDelete: (marker: RelationshipMarker) => void;
};

const RelationshipsPanelEntries = ({
  markers,
  selfSharedId,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
}: RelationshipsPanelEntriesProps) => {
  const entries = buildPanelListEntries(markers, selfSharedId);

  return (
    <div className="overflow-hidden rounded-md border border-border/60 bg-paper">
      {entries.map(entry => (
        <RelationshipsPanelEntry
          key={panelEntryKey(entry)}
          entry={entry}
          selfSharedId={selfSharedId}
          activeRelationshipId={activeRelationshipId}
          onClick={onClick}
          onView={onView}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export { RelationshipsPanelEntries };
