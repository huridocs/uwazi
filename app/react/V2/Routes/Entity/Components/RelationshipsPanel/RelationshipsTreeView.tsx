import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  buildPanelListEntries,
  panelEntryKey,
} from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import {
  getGroupColor,
  groupMarkers,
  type GroupLabelContext,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipPanelRow } from './RelationshipPanelRow.js';
import { panelEntryCount } from './RelationshipsPanelEntryList.js';
import { RelationshipsTreeBranch, RelationshipsTreeNode } from './RelationshipsTreeBranch.js';
import { RelationshipsGroupLabel } from './RelationshipsGroupLabel.js';
import {
  relationshipsPanelGroupByAtom,
  relationshipsPanelSubGroupByAtom,
} from './relationshipsPanelFiltersAtom.js';

type RelationshipsTreeViewProps = {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  selfSharedId: string;
  activeRelationshipId?: string;
  onClick: (marker: RelationshipMarker) => void;
  onView: (marker: RelationshipMarker) => void;
  onDelete: (marker: RelationshipMarker) => void;
};

const renderEntries = (
  items: RelationshipMarker[],
  selfSharedId: string,
  props: Omit<RelationshipsTreeViewProps, 'markers' | 'groupContext' | 'selfSharedId'>
) =>
  buildPanelListEntries(items, selfSharedId).map(entry => (
    <RelationshipsTreeNode key={panelEntryKey(entry)}>
      <RelationshipPanelRow
        entry={entry}
        selfSharedId={selfSharedId}
        activeRelationshipId={props.activeRelationshipId}
        onClick={props.onClick}
        onView={props.onView}
        onDelete={props.onDelete}
      />
    </RelationshipsTreeNode>
  ));

const RelationshipsTreeView = ({
  markers,
  groupContext,
  selfSharedId,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
}: RelationshipsTreeViewProps) => {
  const [groupBy] = useAtom(relationshipsPanelGroupByAtom);
  const [subGroupBy, setSubGroupBy] = useAtom(relationshipsPanelSubGroupByAtom);
  const rowProps = { activeRelationshipId, onClick, onView, onDelete };

  useEffect(() => {
    if (groupBy !== 'none' && subGroupBy === groupBy) setSubGroupBy('none');
  }, [groupBy, subGroupBy, setSubGroupBy]);

  if (markers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <LinkIcon className="mb-3 h-9 w-9 text-ink-tertiary/40" />
        <p className="text-sm text-ink-tertiary">
          <Translate>No relationships found</Translate>
        </p>
      </div>
    );
  }

  if (groupBy === 'none') {
    return <div className="px-3 py-3">{renderEntries(markers, selfSharedId, rowProps)}</div>;
  }

  const primaryGroups = groupMarkers(markers, groupBy, groupContext);

  return (
    <div className="px-3 py-3">
      {primaryGroups.map(([key, groupMarkersList]) => (
        <RelationshipsTreeBranch
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
          count={panelEntryCount(groupMarkersList, selfSharedId)}
          markerIds={groupMarkersList.map(marker => marker._id)}
        >
          {subGroupBy === 'none'
            ? renderEntries(groupMarkersList, selfSharedId, rowProps)
            : groupMarkers(groupMarkersList, subGroupBy, groupContext).map(
                ([subKey, subMarkers]) => (
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
                    {renderEntries(subMarkers, selfSharedId, rowProps)}
                  </RelationshipsTreeBranch>
                )
              )}
        </RelationshipsTreeBranch>
      ))}
    </div>
  );
};

export { RelationshipsTreeView };
