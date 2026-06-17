import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { PanelListEntry } from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { DirectionGlyph } from './DirectionGlyph.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { RelationshipRow } from './RelationshipRow.js';
import { CollapsibleRelationshipRow } from './CollapsibleRelationshipRow.js';
import { useRelationshipRowVisibility } from './useRelationshipRowVisibility.js';

type RelationshipPanelRowHandlers = {
  selfSharedId: string;
  activeRelationshipId?: string;
  onClick: (marker: RelationshipMarker) => void;
  onView: (marker: RelationshipMarker) => void;
  onDelete: (marker: RelationshipMarker) => void;
};

type RelationshipPanelRowProps = RelationshipPanelRowHandlers & {
  entry: PanelListEntry;
  groupContext: GroupLabelContext;
};

const renderNestedRows = (
  markers: RelationshipMarker[],
  handlers: RelationshipPanelRowHandlers,
  groupContext: GroupLabelContext
) =>
  markers.map((marker, index) => (
    <RelationshipRow
      key={marker._id || `nested-${index}`}
      marker={marker}
      selfSharedId={handlers.selfSharedId}
      relationshipTypeName={groupContext.relationshipTypeName(marker.view.type)}
      isSelected={handlers.activeRelationshipId === marker._id}
      onClick={() => handlers.onClick(marker)}
      onView={() => handlers.onView(marker)}
      onDelete={() => handlers.onDelete(marker)}
    />
  ));

const RelationshipPanelRow = ({ entry, groupContext, ...handlers }: RelationshipPanelRowProps) => {
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

    return (
      <CollapsibleRelationshipRow
        checkboxId={aggregate.markerIds[0] ?? ''}
        evidenceCount={aggregate.markerIds.length}
        glyphDirection={glyphDirection}
        relationshipTypeName={hideRelationType ? undefined : relationshipTypeName}
        header={
          hideTargetPill ? null : (
            <TemplatePill templateId={aggregate.targetTemplateId} label={aggregate.targetTitle} />
          )
        }
        meta={
          <>
            <DirectionGlyph direction={glyphDirection} />
            {!hideRelationType && relationshipTypeName && (
              <span className="capitalize">{relationshipTypeName}</span>
            )}
          </>
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
      checkboxId={hub.markerIds[0] ?? ''}
      evidenceCount={hub.markerIds.length}
      headerWrap
      isHub
      memberCount={hub.members.length}
      relationshipTypeName={hideRelationType ? undefined : relationshipTypeName}
      header={
        hideTargetPill ? null : (
          <>
            {hub.members.map(member => (
              <TemplatePill
                key={member.sharedId}
                templateId={member.templateId}
                label={member.title}
              />
            ))}
          </>
        )
      }
      meta={
        <>
          {!hideRelationType && relationshipTypeName && (
            <>
              <span className="capitalize">{relationshipTypeName}</span>
              <span>·</span>
            </>
          )}
          <span>
            {hub.members.length} <Translate>parties</Translate>
          </span>
        </>
      }
    >
      {renderNestedRows(markers, handlers, groupContext)}
    </CollapsibleRelationshipRow>
  );
};

export type { RelationshipPanelRowHandlers };
export { RelationshipPanelRow };
