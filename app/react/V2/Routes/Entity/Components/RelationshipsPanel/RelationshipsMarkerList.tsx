import React from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  getGroupColor,
  groupMarkers,
  type GroupLabelContext,
  type RelationshipsPanelGroupBy,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipGroupedCard } from './RelationshipGroupedCard.js';
import { RelationshipsGroupLabel } from './RelationshipsGroupLabel.js';
import { panelEntryCount, RelationshipsPanelEntryList } from './RelationshipsPanelEntryList.js';
import { type RelationshipPanelRowHandlers } from './RelationshipPanelRow.js';
import { useRelationshipsGroupBy } from './useRelationshipsGroupBy.js';

type RelationshipsMarkerListProps = RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
};

const renderGrouped = (
  items: RelationshipMarker[],
  groupBy: RelationshipsPanelGroupBy,
  subGroupBy: RelationshipsPanelGroupBy,
  groupContext: GroupLabelContext,
  props: RelationshipPanelRowHandlers
) => {
  const primaryGroups = groupMarkers(items, groupBy, groupContext);

  return (
    <div className="space-y-1.5">
      {primaryGroups.map(([key, groupMarkersList]) => (
        <RelationshipGroupedCard
          key={key || 'all'}
          title={
            <RelationshipsGroupLabel
              groupKey={key}
              groupBy={groupBy}
              groupContext={groupContext}
              markers={groupMarkersList}
            />
          }
          color={getGroupColor(key, groupBy, groupContext, groupMarkersList)}
          count={panelEntryCount(groupMarkersList, props.selfSharedId)}
          markerIds={groupMarkersList.map(marker => marker._id)}
        >
          {subGroupBy === 'none' ? (
            <RelationshipsPanelEntryList {...props} markers={groupMarkersList} />
          ) : (
            <div className="space-y-1.5 bg-warm/30 px-2 py-2">
              {groupMarkers(groupMarkersList, subGroupBy, groupContext).map(
                ([subKey, subMarkers]) => (
                  <RelationshipGroupedCard
                    key={`${key}::${subKey}`}
                    title={
                      <RelationshipsGroupLabel
                        groupKey={subKey}
                        groupBy={subGroupBy}
                        groupContext={groupContext}
                        markers={subMarkers}
                      />
                    }
                    color={getGroupColor(subKey, subGroupBy, groupContext, subMarkers)}
                    count={panelEntryCount(subMarkers, props.selfSharedId)}
                    markerIds={subMarkers.map(marker => marker._id)}
                  >
                    <RelationshipsPanelEntryList {...props} markers={subMarkers} />
                  </RelationshipGroupedCard>
                )
              )}
            </div>
          )}
        </RelationshipGroupedCard>
      ))}
    </div>
  );
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

  return renderGrouped(markers, groupBy, subGroupBy, groupContext, rowProps);
};

export { RelationshipsMarkerList };
