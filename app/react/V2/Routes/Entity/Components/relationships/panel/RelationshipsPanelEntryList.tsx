/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo } from 'react';
import {
  buildFlatPanelListEntries,
  buildPanelListEntries,
  buildTreePanelListEntries,
  panelEntryKey,
  type PanelListEntry,
} from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { useDocumentRelationshipNav } from '#V2/Routes/Entity/Components/context/index.js';
import {
  RelationshipPanelRow,
  type RelationshipPanelRowHandlers,
} from '../rows/RelationshipPanelRow.js';
import { RenderIfVisible } from './RenderIfVisible.js';

const ROW_ESTIMATED_HEIGHT = 72;
const ROW_WINDOW_OFFSET = 600;

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

const entryMatchesId = (entry: PanelListEntry, id: string): boolean => {
  if (entry.kind === 'reference') return entry.marker._id === id;
  if (entry.kind === 'aggregate') return entry.aggregate.markerIds.includes(id);
  return entry.hub.markerIds.includes(id);
};

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
  flat = false,
  markers,
  groupContext,
  selfSharedId,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
}: RelationshipsPanelEntryListProps) => {
  const { scrollToRelationshipPanel } = useDocumentRelationshipNav();

  const entries = useMemo(() => {
    if (flat) return buildFlatPanelListEntries(markers);
    if (variant === 'tree') return buildTreePanelListEntries(markers, selfSharedId);
    return buildPanelListEntries(markers, selfSharedId);
  }, [flat, variant, markers, selfSharedId]);

  const rowProps = { selfSharedId, activeRelationshipId, onClick, onView, onDelete };

  const content = entries.map(entry => {
    const key = panelEntryKey(entry);
    const row = <RelationshipPanelRow entry={entry} groupContext={groupContext} {...rowProps} />;

    const pinned =
      (!!activeRelationshipId && entryMatchesId(entry, activeRelationshipId)) ||
      (!!scrollToRelationshipPanel && entryMatchesId(entry, scrollToRelationshipPanel));

    if (variant !== 'list' || pinned) return <React.Fragment key={key}>{row}</React.Fragment>;

    return (
      <RenderIfVisible
        key={key}
        defaultHeight={ROW_ESTIMATED_HEIGHT}
        visibleOffset={ROW_WINDOW_OFFSET}
      >
        {row}
      </RenderIfVisible>
    );
  });

  if (bordered) {
    return (
      <div className="overflow-hidden rounded-md border border-border/60 bg-paper">{content}</div>
    );
  }

  return <>{content}</>;
};

export { panelEntryCount, renderPanelEntryRows, RelationshipsPanelEntryList };
