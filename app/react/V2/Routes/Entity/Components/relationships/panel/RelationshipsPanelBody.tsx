import React from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipsTreeView } from '../views/RelationshipsTreeView.js';
import { RelationshipsGraphView } from '../views/RelationshipsGraphView.js';
import { type RelationshipPanelRowHandlers } from '../rows/RelationshipPanelRow.js';
import { RelationshipsMarkerListBody } from './RelationshipsMarkerListBody.js';
import { useRelationshipsPanelFilters } from '#V2/Routes/Entity/Components/context/index.js';

type RelationshipsPanelBodyProps = RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  selfTitle: string;
};

const RelationshipsPanelBody = ({
  markers,
  groupContext,
  selfSharedId,
  selfTitle,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
}: RelationshipsPanelBodyProps) => {
  const { view } = useRelationshipsPanelFilters();
  const rowProps = { selfSharedId, activeRelationshipId, onClick, onView, onDelete };

  if (view === 'tree') {
    return <RelationshipsTreeView markers={markers} groupContext={groupContext} {...rowProps} />;
  }

  if (view === 'graph') {
    return (
      <RelationshipsGraphView
        markers={markers}
        groupContext={groupContext}
        selfSharedId={selfSharedId}
        selfTitle={selfTitle}
        activeRelationshipId={activeRelationshipId}
        onNodeClick={markerId => {
          const marker = markers.find(item => item._id === markerId);
          if (marker) onClick(marker);
        }}
      />
    );
  }

  return (
    <div className="py-3">
      <RelationshipsMarkerListBody
        variant="list"
        markers={markers}
        groupContext={groupContext}
        {...rowProps}
      />
    </div>
  );
};

export { RelationshipsPanelBody };
