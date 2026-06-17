import React from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipsTreeView } from './RelationshipsTreeView.js';
import { RelationshipsGraphView } from './RelationshipsGraphView.js';
import { type RelationshipPanelRowHandlers } from './RelationshipPanelRow.js';
import { RelationshipsPanelEntryList } from './RelationshipsPanelEntryList.js';
import { RelationshipsGroupedSections } from './RelationshipsGroupedSections.js';
import { useRelationshipsPanelFilters } from '../EntityScopedProvider.js';

type RelationshipsPanelBodyProps = RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  selfTitle: string;
};

const RelationshipsListBody = ({
  markers,
  groupContext,
  ...rowProps
}: RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
}) => {
  const { groupBy, subGroupBy } = useRelationshipsPanelFilters();

  if (groupBy === 'none') {
    return (
      <RelationshipsPanelEntryList
        bordered
        markers={markers}
        groupContext={groupContext}
        {...rowProps}
      />
    );
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
      <RelationshipsListBody markers={markers} groupContext={groupContext} {...rowProps} />
    </div>
  );
};

export { RelationshipsPanelBody };
