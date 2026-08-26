import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { useFormatMetadata } from '#V2/Components/Metadata/hooks/useFormatMetadata.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { EntityOverlayMetadataSummary } from './EntityOverlayMetadataSummary.js';
import { EntityOverlayProperties } from './EntityOverlayProperties.js';
import { EntityOverlayReferences } from './EntityOverlayReferences.js';
import { EntityOverlayConnections } from './EntityOverlayConnections.js';
import { isOverlayTextReferenceMarker } from './overlayMarkerKind.js';

type EntityOverlayContentProps = {
  entity: Entity;
  markers: RelationshipMarker[];
  selfSharedId: string;
};

const EntityOverlayContent = ({ entity, markers, selfSharedId }: EntityOverlayContentProps) => {
  const templates = useAtomValue(templatesAtom);
  const { entityTemplate, metadata } = useFormatMetadata(entity, templates, {
    groupGeolocationProperties: true,
  });

  const { referenceMarkers, connectionMarkers } = useMemo(() => {
    const references: RelationshipMarker[] = [];
    const connections: RelationshipMarker[] = [];
    markers.forEach(marker => {
      if (isOverlayTextReferenceMarker(marker)) {
        references.push(marker);
      } else {
        connections.push(marker);
      }
    });
    return { referenceMarkers: references, connectionMarkers: connections };
  }, [markers]);

  return (
    <div
      className="flex flex-1 flex-col gap-5 overflow-auto bg-(--color-theme-surface-raised) p-4 pb-8"
      style={{
        backgroundColor:
          'var(--color-theme-surface-raised, var(--color-theme-bg-surface, #ffffff))',
      }}
    >
      <div className="w-fit shrink-0">
        <TemplatePill templateId={entity.template} size="md" />
      </div>
      <EntityOverlayMetadataSummary
        entity={entity}
        entityTemplate={entityTemplate}
        referenceCount={referenceMarkers.length}
      />
      <EntityOverlayProperties metadata={metadata} translationContext={entityTemplate?._id ?? ''} />
      {referenceMarkers.length > 0 && (
        <EntityOverlayReferences markers={referenceMarkers} selfSharedId={selfSharedId} />
      )}
      <EntityOverlayConnections markers={connectionMarkers} selfSharedId={selfSharedId} />
    </div>
  );
};

export { EntityOverlayContent };
