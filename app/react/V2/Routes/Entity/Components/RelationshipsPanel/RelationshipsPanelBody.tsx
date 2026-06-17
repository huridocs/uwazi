import React from 'react';
import { useAtomValue } from 'jotai';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipsMarkerList } from './RelationshipsMarkerList.js';
import { RelationshipsTreeView } from './RelationshipsTreeView.js';
import { RelationshipsGraphView } from './RelationshipsGraphView.js';
import { relationshipsPanelViewAtom } from './relationshipsPanelFiltersAtom.js';
import { type RelationshipPanelRowHandlers } from './RelationshipPanelRow.js';

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
  const view = useAtomValue(relationshipsPanelViewAtom);
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
      <RelationshipsMarkerList markers={markers} groupContext={groupContext} {...rowProps} />
    </div>
  );
};

export { RelationshipsPanelBody };
