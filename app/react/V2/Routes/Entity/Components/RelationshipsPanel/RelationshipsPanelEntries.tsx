import React from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { RelationshipsPanelEntryList } from './RelationshipsPanelEntryList.js';

type RelationshipsPanelEntriesProps = {
  markers: RelationshipMarker[];
  selfSharedId: string;
  activeRelationshipId?: string;
  onClick: (marker: RelationshipMarker) => void;
  onView: (marker: RelationshipMarker) => void;
  onDelete: (marker: RelationshipMarker) => void;
};

const RelationshipsPanelEntries = (props: RelationshipsPanelEntriesProps) => (
  <RelationshipsPanelEntryList {...props} bordered />
);

export { RelationshipsPanelEntries };
