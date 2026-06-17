import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { type RelationshipPanelRowHandlers } from '../rows/RelationshipPanelRow.js';
import { RelationshipsEmptyView } from '../panel/RelationshipsEmptyView.js';
import { RelationshipsGroupedSections } from '../panel/RelationshipsGroupedSections.js';
import { RelationshipsPanelEntryList } from '../panel/RelationshipsPanelEntryList.js';
import { useRelationshipsPanelFilters } from '#V2/Routes/Entity/Components/context/index.js';

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
  const { groupBy, subGroupBy } = useRelationshipsPanelFilters();
  const rowProps = { selfSharedId, activeRelationshipId, onClick, onView, onDelete };

  if (markers.length === 0) {
    return (
      <RelationshipsEmptyView>
        <Translate>No relationships found</Translate>
      </RelationshipsEmptyView>
    );
  }

  if (groupBy === 'none') {
    return (
      <RelationshipsPanelEntryList
        variant="tree"
        markers={markers}
        groupContext={groupContext}
        {...rowProps}
      />
    );
  }

  return (
    <div className="py-3">
      <RelationshipsGroupedSections
        markers={markers}
        groupContext={groupContext}
        groupBy={groupBy}
        subGroupBy={subGroupBy}
        variant="tree"
        {...rowProps}
      />
    </div>
  );
};

export { RelationshipsTreeView };
