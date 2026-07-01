import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { PanelListEntry } from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import {
  markerNestedEvidenceKey,
  markerReferenceText,
  type RelationshipMarker,
} from '#V2/Components/Relationships/types.js';
import { DirectionGlyph } from './DirectionGlyph.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { RelationshipRow } from '../rows/RelationshipRow.js';
import { CollapsibleRelationshipRow } from './CollapsibleRelationshipRow.js';
import { useRelationshipRowVisibility } from '../hooks/useRelationshipRowVisibility.js';
import { RelationshipsTreeNode, getTreeLine } from '../views/RelationshipsTreeBranch.js';

type RelationshipPanelRowHandlers = {
  selfSharedId: string;
  activeRelationshipId?: string;
  onClick: (marker: RelationshipMarker) => void;
  onView: (marker: RelationshipMarker) => void;
  onDelete: (marker: RelationshipMarker, relationshipIds?: string[]) => void;
};

type RelationshipPanelRowProps = RelationshipPanelRowHandlers & {
  entry: PanelListEntry;
  groupContext: GroupLabelContext;
};

type NestedEvidenceGroup = {
  marker: RelationshipMarker;
  markers: RelationshipMarker[];
};

const nestedEvidenceCount = (markers: RelationshipMarker[]): number => markers.length;

const groupNestedEvidence = (
  markers: RelationshipMarker[],
  selfSharedId: string
): NestedEvidenceGroup[] => {
  const grouped = new Map<string, NestedEvidenceGroup>();
  markers.forEach(marker => {
    const key = markerNestedEvidenceKey(marker, selfSharedId);
    const group = grouped.get(key);
    if (group) {
      group.markers.push(marker);
      return;
    }
    grouped.set(key, { marker, markers: [marker] });
  });
  return Array.from(grouped.values());
};

const renderNestedRows = (
  markers: RelationshipMarker[],
  handlers: RelationshipPanelRowHandlers,
  groupContext: GroupLabelContext
) => {
  const groups = groupNestedEvidence(
    markers.filter(marker => markerReferenceText(marker, handlers.selfSharedId)),
    handlers.selfSharedId
  );
  return groups.map(({ marker, markers: representedMarkers }, index) => {
    const representedIds = representedMarkers.map(representedMarker => representedMarker._id);
    return (
      <RelationshipsTreeNode key={marker._id} treeLine={getTreeLine(index, groups.length)}>
        <RelationshipRow
          nested
          marker={marker}
          selfSharedId={handlers.selfSharedId}
          relationshipTypeName={groupContext.relationshipTypeName(marker.view.type)}
          isSelected={
            !!handlers.activeRelationshipId &&
            representedIds.includes(handlers.activeRelationshipId)
          }
          representedIds={representedIds}
          representedCount={representedMarkers.length}
          onClick={() => handlers.onClick(marker)}
          onView={() => handlers.onView(marker)}
          onDelete={() => handlers.onDelete(marker, representedIds)}
        />
      </RelationshipsTreeNode>
    );
  });
};

const RelationshipPanelRowComponent = ({
  entry,
  groupContext,
  ...handlers
}: RelationshipPanelRowProps) => {
  const { hideTargetPill, hideRelationType } = useRelationshipRowVisibility();

  if (entry.kind === 'reference') {
    return (
      <RelationshipRow
        marker={entry.marker}
        selfSharedId={handlers.selfSharedId}
        relationshipTypeName={groupContext.relationshipTypeName(entry.marker.view.type)}
        isSelected={handlers.activeRelationshipId === entry.marker._id}
        onClick={() => handlers.onClick(entry.marker)}
        onView={() => handlers.onView(entry.marker)}
        onDelete={() => handlers.onDelete(entry.marker)}
      />
    );
  }

  if (entry.kind === 'aggregate') {
    const { aggregate, markers } = entry;
    const relationshipTypeName = groupContext.relationshipTypeName(aggregate.relationType);
    const glyphDirection =
      aggregate.directions.length > 1 ? 'both' : (aggregate.directions[0] ?? 'outgoing');

    const soleMarker = markers.length === 1 ? markers[0] : undefined;

    return (
      <CollapsibleRelationshipRow
        checkboxIds={aggregate.markerIds}
        evidenceCount={nestedEvidenceCount(markers)}
        glyphDirection={glyphDirection}
        relationshipTypeName={hideRelationType ? undefined : relationshipTypeName}
        targetTemplateId={aggregate.targetTemplateId}
        entityTitle={hideTargetPill ? undefined : aggregate.targetTitle}
        templateName={groupContext.templateName(aggregate.targetTemplateId)}
        onHeaderClick={soleMarker ? () => handlers.onClick(soleMarker) : undefined}
        header={null}
        meta={
          glyphDirection || (!hideRelationType && relationshipTypeName) ? (
            <>
              <DirectionGlyph direction={glyphDirection} />
              {!hideRelationType && relationshipTypeName && (
                <span className="capitalize">{relationshipTypeName}</span>
              )}
            </>
          ) : undefined
        }
      >
        {renderNestedRows(markers, handlers, groupContext)}
      </CollapsibleRelationshipRow>
    );
  }

  const { hub, markers } = entry;
  const relationshipTypeName = groupContext.relationshipTypeName(hub.relationType);

  return (
    <CollapsibleRelationshipRow
      checkboxIds={hub.markerIds}
      evidenceCount={nestedEvidenceCount(markers)}
      headerWrap
      isHub
      memberCount={hub.members.length}
      relationshipTypeName={hideRelationType ? undefined : relationshipTypeName}
      header={
        <>
          {hub.members.map(member => (
            <TemplatePill
              key={member.sharedId}
              templateId={member.templateId}
              label={member.title}
            />
          ))}
        </>
      }
      meta={
        hideRelationType ? (
          <span>
            {hub.members.length} <Translate>parties</Translate>
          </span>
        ) : (
          <>
            <span className="capitalize">{relationshipTypeName}</span>
            <span>·</span>
            <span>
              {hub.members.length} <Translate>parties</Translate>
            </span>
          </>
        )
      }
    >
      {renderNestedRows(markers, handlers, groupContext)}
    </CollapsibleRelationshipRow>
  );
};

const RelationshipPanelRow = React.memo(RelationshipPanelRowComponent);

export type { RelationshipPanelRowHandlers };
export { RelationshipPanelRow, groupNestedEvidence };
