import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  buildPanelListEntries,
  panelEntryKey,
} from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import {
  getGroupColor,
  groupMarkers,
  type GroupLabelContext,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipPanelRow, type RelationshipPanelRowHandlers } from './RelationshipPanelRow.js';
import { panelEntryCount, RelationshipsPanelEntryList } from './RelationshipsPanelEntryList.js';
import {
  RelationshipsTreeBranch,
  RelationshipsTreeNode,
  getTreeLine,
} from './RelationshipsTreeBranch.js';
import { RelationshipsEmptyView } from './RelationshipsEmptyView.js';
import { RelationshipsGroupLabel } from './RelationshipsGroupLabel.js';
import { useRelationshipsGroupBy } from './useRelationshipsGroupBy.js';

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
  const { groupBy, subGroupBy } = useRelationshipsGroupBy();
  const rowProps = { selfSharedId, activeRelationshipId, onClick, onView, onDelete };

  if (markers.length === 0) {
    return (
      <RelationshipsEmptyView>
        <Translate>No relationships found</Translate>
      </RelationshipsEmptyView>
    );
  }

  if (groupBy === 'none') {
    const entries = buildPanelListEntries(markers, selfSharedId);
    return (
      <div className="py-3">
        {entries.map((entry, index) => (
          <RelationshipsTreeNode
            key={panelEntryKey(entry)}
            treeLine={getTreeLine(index, entries.length)}
          >
            <RelationshipPanelRow entry={entry} {...rowProps} />
          </RelationshipsTreeNode>
        ))}
      </div>
    );
  }

  const primaryGroups = groupMarkers(markers, groupBy, groupContext);

  return (
    <div className="py-3">
      {primaryGroups.map(([key, groupMarkersList]) => (
        <RelationshipsTreeBranch
          key={key || 'all'}
          connectHeader={false}
          title={
            <RelationshipsGroupLabel
              groupKey={key}
              groupBy={groupBy}
              groupContext={groupContext}
              markers={groupMarkersList}
            />
          }
          color={getGroupColor(key, groupBy, groupContext, groupMarkersList)}
          count={panelEntryCount(groupMarkersList, selfSharedId)}
          markerIds={groupMarkersList.map(marker => marker._id)}
        >
          {subGroupBy === 'none' ? (
            <RelationshipsPanelEntryList markers={groupMarkersList} {...rowProps} />
          ) : (
            groupMarkers(groupMarkersList, subGroupBy, groupContext).map(([subKey, subMarkers]) => (
              <RelationshipsTreeBranch
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
                count={panelEntryCount(subMarkers, selfSharedId)}
                markerIds={subMarkers.map(marker => marker._id)}
              >
                <RelationshipsPanelEntryList markers={subMarkers} {...rowProps} />
              </RelationshipsTreeBranch>
            ))
          )}
        </RelationshipsTreeBranch>
      ))}
    </div>
  );
};

export { RelationshipsTreeView };
