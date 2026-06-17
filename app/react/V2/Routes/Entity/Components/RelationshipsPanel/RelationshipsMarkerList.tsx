import React from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipsPanelEntryList } from './RelationshipsPanelEntryList.js';
import { type RelationshipPanelRowHandlers } from './RelationshipPanelRow.js';
import { RelationshipsGroupedSections } from './RelationshipsGroupedSections.js';
import { useRelationshipsGroupBy } from './useRelationshipsGroupBy.js';

type RelationshipsMarkerListProps = RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
};

const RelationshipsMarkerList = ({
  markers,
  groupContext,
  selfSharedId,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
}: RelationshipsMarkerListProps) => {
  const { groupBy, subGroupBy } = useRelationshipsGroupBy();
  const rowProps = { selfSharedId, activeRelationshipId, onClick, onView, onDelete };

  if (groupBy === 'none') {
    return <RelationshipsPanelEntryList bordered markers={markers} {...rowProps} />;
  }

  return (
    <RelationshipsGroupedSections
      markers={markers}
      groupContext={groupContext}
      groupBy={groupBy}
      subGroupBy={subGroupBy}
      variant="list"
      {...rowProps}
    />
  );
};

export { RelationshipsMarkerList };
