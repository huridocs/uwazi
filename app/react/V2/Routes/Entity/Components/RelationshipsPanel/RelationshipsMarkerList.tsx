import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  getGroupColor,
  groupMarkers,
  type GroupLabelContext,
  type RelationshipsPanelGroupBy,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipGroupedCard } from './RelationshipGroupedCard.js';
import { RelationshipsGroupLabel } from './RelationshipsGroupLabel.js';
import { RelationshipsPanelEntries } from './RelationshipsPanelEntries.js';
import { panelEntryCount, RelationshipsPanelEntryList } from './RelationshipsPanelEntryList.js';
import {
  relationshipsPanelGroupByAtom,
  relationshipsPanelSubGroupByAtom,
} from './relationshipsPanelFiltersAtom.js';

type RelationshipsMarkerListProps = {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  selfSharedId: string;
  activeRelationshipId?: string;
  onClick: (marker: RelationshipMarker) => void;
  onView: (marker: RelationshipMarker) => void;
  onDelete: (marker: RelationshipMarker) => void;
};

type RowProps = Omit<RelationshipsMarkerListProps, 'markers' | 'groupContext'>;

const renderGrouped = (
  items: RelationshipMarker[],
  groupBy: RelationshipsPanelGroupBy,
  subGroupBy: RelationshipsPanelGroupBy,
  groupContext: GroupLabelContext,
  props: RowProps
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
  const [groupBy] = useAtom(relationshipsPanelGroupByAtom);
  const [subGroupBy, setSubGroupBy] = useAtom(relationshipsPanelSubGroupByAtom);
  const rowProps = { selfSharedId, activeRelationshipId, onClick, onView, onDelete };

  useEffect(() => {
    if (groupBy !== 'none' && subGroupBy === groupBy) setSubGroupBy('none');
  }, [groupBy, subGroupBy, setSubGroupBy]);

  if (groupBy === 'none') {
    return <RelationshipsPanelEntries markers={markers} {...rowProps} />;
  }

  return renderGrouped(markers, groupBy, subGroupBy, groupContext, rowProps);
};

export { RelationshipsMarkerList };
