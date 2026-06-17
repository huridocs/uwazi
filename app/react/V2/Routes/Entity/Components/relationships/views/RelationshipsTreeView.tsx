import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { type RelationshipPanelRowHandlers } from '../rows/RelationshipPanelRow.js';
import { RelationshipsEmptyView } from '../panel/RelationshipsEmptyView.js';
import { RelationshipsMarkerListBody } from '../panel/RelationshipsMarkerListBody.js';

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
  const rowProps = { selfSharedId, activeRelationshipId, onClick, onView, onDelete };

  if (markers.length === 0) {
    return (
      <RelationshipsEmptyView>
        <Translate>No relationships found</Translate>
      </RelationshipsEmptyView>
    );
  }

  return (
    <RelationshipsMarkerListBody
      variant="tree"
      markers={markers}
      groupContext={groupContext}
      {...rowProps}
    />
  );
};

export { RelationshipsTreeView };
