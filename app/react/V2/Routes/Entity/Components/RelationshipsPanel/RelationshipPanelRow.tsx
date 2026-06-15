import React from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import type { PanelListEntry } from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { DirectionGlyph } from './DirectionGlyph.js';
import { EntityPill } from './EntityPill.js';
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
};

const renderNestedRows = (markers: RelationshipMarker[], handlers: RelationshipPanelRowHandlers) =>
  markers.map((marker, index) => (
    <RelationshipRow
      key={marker._id || `nested-${index}`}
      marker={marker}
      selfSharedId={handlers.selfSharedId}
      isSelected={handlers.activeRelationshipId === marker._id}
      onClick={() => handlers.onClick(marker)}
      onView={() => handlers.onView(marker)}
      onDelete={() => handlers.onDelete(marker)}
    />
  ));

const RelationshipPanelRow = ({ entry, ...handlers }: RelationshipPanelRowProps) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const { hideTargetPill, hideRelationType } = useRelationshipRowVisibility();

  if (entry.kind === 'reference') {
    return (
      <RelationshipRow
        marker={entry.marker}
        selfSharedId={handlers.selfSharedId}
        isSelected={handlers.activeRelationshipId === entry.marker._id}
        onClick={() => handlers.onClick(entry.marker)}
        onView={() => handlers.onView(entry.marker)}
        onDelete={() => handlers.onDelete(entry.marker)}
      />
    );
  }

  if (entry.kind === 'aggregate') {
    const { aggregate, markers } = entry;
    const relationshipTypeName =
      relationshipTypes.find(type => type._id === aggregate.relationType)?.name ??
      aggregate.relationType;
    const glyphDirection =
      aggregate.directions.length > 1 ? 'both' : (aggregate.directions[0] ?? 'outgoing');

    return (
      <CollapsibleRelationshipRow
        checkboxId={aggregate.markerIds[0] ?? ''}
        evidenceCount={aggregate.markerIds.length}
        header={
          hideTargetPill ? null : (
            <EntityPill templateId={aggregate.targetTemplateId} label={aggregate.targetTitle} />
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
        {renderNestedRows(markers, handlers)}
      </CollapsibleRelationshipRow>
    );
  }

  const { hub, markers } = entry;
  const relationshipTypeName =
    relationshipTypes.find(type => type._id === hub.relationType)?.name ?? hub.relationType;

  return (
    <CollapsibleRelationshipRow
      checkboxId={hub.markerIds[0] ?? ''}
      evidenceCount={hub.markerIds.length}
      headerWrap
      header={
        hideTargetPill ? null : (
          <>
            {hub.members.map(member => (
              <EntityPill
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
          <span className="uppercase tracking-wide">
            <Translate>hub</Translate>
          </span>
          {!hideRelationType && relationshipTypeName && (
            <>
              <span>·</span>
              <span className="capitalize">{relationshipTypeName}</span>
            </>
          )}
          <span>·</span>
          <span>
            {hub.members.length} <Translate>parties</Translate>
          </span>
        </>
      }
    >
      {renderNestedRows(markers, handlers)}
    </CollapsibleRelationshipRow>
  );
};

export { RelationshipPanelRow };
