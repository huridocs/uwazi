import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  getGroupColor,
  groupMarkers,
  type GroupLabelContext,
  type RelationshipsPanelGroupBy,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipRow } from './RelationshipRow.js';
import { RelationshipGroupedCard } from './RelationshipGroupedCard.js';
import { RelationshipsGroupLabel } from './RelationshipsGroupLabel.js';
import { RelationshipsPanelEntries } from './RelationshipsPanelEntries.js';
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

const renderRows = (
  items: RelationshipMarker[],
  props: Omit<RelationshipsMarkerListProps, 'markers' | 'groupContext'>
) =>
  items.map((marker, index) => (
    <RelationshipRow
      key={marker._id || `relationship-${index}`}
      marker={marker}
      selfSharedId={props.selfSharedId}
      isSelected={props.activeRelationshipId === marker._id}
      onClick={() => props.onClick(marker)}
      onView={() => props.onView(marker)}
      onDelete={() => props.onDelete(marker)}
    />
  ));

const renderGrouped = (
  items: RelationshipMarker[],
  groupBy: RelationshipsPanelGroupBy,
  subGroupBy: RelationshipsPanelGroupBy,
  groupContext: GroupLabelContext,
  props: Omit<RelationshipsMarkerListProps, 'markers' | 'groupContext'>
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
          count={groupMarkersList.length}
        >
          {subGroupBy === 'none' ? (
            renderRows(groupMarkersList, props)
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
                    count={subMarkers.length}
                  >
                    {renderRows(subMarkers, props)}
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
    return (
      <RelationshipsPanelEntries
        markers={markers}
        selfSharedId={selfSharedId}
        activeRelationshipId={activeRelationshipId}
        onClick={onClick}
        onView={onView}
        onDelete={onDelete}
      />
    );
  }

  return renderGrouped(markers, groupBy, subGroupBy, groupContext, rowProps);
};

export { RelationshipsMarkerList };
