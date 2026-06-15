import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  getGroupColor,
  getGroupLabel,
  groupMarkers,
  type GroupLabelContext,
  type RelationshipsPanelGroupBy,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipRow } from './RelationshipRow.js';
import { RelationshipGroupedCard } from './RelationshipGroupedCard.js';
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
          title={getGroupLabel(key, groupBy, groupContext, groupMarkersList)}
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
                    title={getGroupLabel(subKey, subGroupBy, groupContext, subMarkers)}
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
      <div className="overflow-hidden rounded-md border border-border/60 bg-paper">
        {renderRows(markers, rowProps)}
      </div>
    );
  }

  return renderGrouped(markers, groupBy, subGroupBy, groupContext, rowProps);
};

export { RelationshipsMarkerList };
