/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import {
  buildFlatPanelListEntries,
  buildPanelListEntries,
  buildTreePanelListEntries,
  panelEntryKey,
} from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  RelationshipPanelRow,
  type RelationshipPanelRowHandlers,
} from '../rows/RelationshipPanelRow.js';

type RelationshipsPanelEntryListProps = RelationshipPanelRowHandlers & {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  bordered?: boolean;
  variant?: 'list' | 'tree';
  flat?: boolean;
};

const panelEntryCount = (
  markers: RelationshipMarker[],
  selfSharedId: string,
  flat = false
): number => (flat ? markers.length : buildPanelListEntries(markers, selfSharedId).length);

const renderPanelEntryRows = ({
  markers,
  groupContext,
  selfSharedId,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
  flat = false,
  variant = 'list',
}: RelationshipsPanelEntryListProps): React.ReactNode[] => {
  let entries;
  if (flat) {
    entries = buildFlatPanelListEntries(markers);
  } else if (variant === 'tree') {
    entries = buildTreePanelListEntries(markers, selfSharedId);
  } else {
    entries = buildPanelListEntries(markers, selfSharedId);
  }
  const rowProps = { selfSharedId, activeRelationshipId, onClick, onView, onDelete };

  return entries.map(entry => (
    <RelationshipPanelRow
      key={panelEntryKey(entry)}
      entry={entry}
      groupContext={groupContext}
      {...rowProps}
    />
  ));
};

const RelationshipsPanelEntryList = ({
  bordered = false,
  variant = 'list',
  ...props
}: RelationshipsPanelEntryListProps) => {
  const content = renderPanelEntryRows({ bordered, variant, ...props });

  if (bordered) {
    return (
      <div className="overflow-hidden rounded-md border border-border/60 bg-paper">{content}</div>
    );
  }

  return <>{content}</>;
};

export { panelEntryCount, renderPanelEntryRows, RelationshipsPanelEntryList };
