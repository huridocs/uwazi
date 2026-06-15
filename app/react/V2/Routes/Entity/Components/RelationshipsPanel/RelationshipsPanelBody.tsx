import React from 'react';
import { useAtomValue } from 'jotai';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipsMarkerList } from './RelationshipsMarkerList.js';
import { RelationshipsTreeView } from './RelationshipsTreeView.js';
import { RelationshipsGraphView } from './RelationshipsGraphView.js';
import { relationshipsPanelViewAtom } from './relationshipsPanelFiltersAtom.js';

type RelationshipsPanelBodyProps = {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  selfSharedId: string;
  selfTitle: string;
  activeRelationshipId?: string;
  onClick: (marker: RelationshipMarker) => void;
  onView: (marker: RelationshipMarker) => void;
  onDelete: (marker: RelationshipMarker) => void;
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
  const view = useAtomValue(relationshipsPanelViewAtom);

  if (view === 'tree') {
    return (
      <RelationshipsTreeView
        markers={markers}
        groupContext={groupContext}
        selfSharedId={selfSharedId}
        activeRelationshipId={activeRelationshipId}
        onClick={onClick}
        onView={onView}
        onDelete={onDelete}
      />
    );
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
    <div className="px-3 py-3">
      <RelationshipsMarkerList
        markers={markers}
        groupContext={groupContext}
        selfSharedId={selfSharedId}
        activeRelationshipId={activeRelationshipId}
        onClick={onClick}
        onView={onView}
        onDelete={onDelete}
      />
    </div>
  );
};

export { RelationshipsPanelBody };
