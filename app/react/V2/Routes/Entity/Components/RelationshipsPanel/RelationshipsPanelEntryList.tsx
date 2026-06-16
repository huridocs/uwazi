import React from 'react';
import {
  buildPanelListEntries,
  panelEntryKey,
} from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { RelationshipPanelRow, type RelationshipPanelRowHandlers } from './RelationshipPanelRow.js';

type RelationshipsPanelEntryListProps = RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  bordered?: boolean;
};

const panelEntryCount = (markers: RelationshipMarker[], selfSharedId: string): number =>
  buildPanelListEntries(markers, selfSharedId).length;

const RelationshipsPanelEntryList = ({
  markers,
  selfSharedId,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
  bordered = false,
}: RelationshipsPanelEntryListProps) => {
  const entries = buildPanelListEntries(markers, selfSharedId);
  const content = entries.map(entry => (
    <RelationshipPanelRow
      key={panelEntryKey(entry)}
      entry={entry}
      selfSharedId={selfSharedId}
      activeRelationshipId={activeRelationshipId}
      onClick={onClick}
      onView={onView}
      onDelete={onDelete}
    />
  ));

  if (bordered) {
    return (
      <div className="overflow-hidden rounded-md border border-border/60 bg-paper">{content}</div>
    );
  }

  return <>{content}</>;
};

export { panelEntryCount, RelationshipsPanelEntryList };
