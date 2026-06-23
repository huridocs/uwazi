import React from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { useFormatMetadata } from '#V2/Components/Metadata/hooks/useFormatMetadata.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { EntityOverlayMetadataSummary } from './EntityOverlayMetadataSummary.js';
import { EntityOverlayProperties } from './EntityOverlayProperties.js';
import { EntityOverlayReferences } from './EntityOverlayReferences.js';

type EntityOverlayContentProps = {
  entity: Entity;
  referenceMarkers: RelationshipMarker[];
  selfSharedId: string;
};

const EntityOverlayContent = ({
  entity,
  referenceMarkers,
  selfSharedId,
}: EntityOverlayContentProps) => {
  const templates = useAtomValue(templatesAtom);
  const { entityTemplate, metadata } = useFormatMetadata(entity, templates, {
    groupGeolocationProperties: true,
  });

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-auto p-4 pb-8">
      <TemplatePill templateId={entity.template} size="md" />
      <EntityOverlayMetadataSummary
        entity={entity}
        entityTemplate={entityTemplate}
        referenceCount={referenceMarkers.length}
      />
      <EntityOverlayProperties metadata={metadata} translationContext={entityTemplate?._id ?? ''} />
      {referenceMarkers.length > 0 && (
        <EntityOverlayReferences markers={referenceMarkers} selfSharedId={selfSharedId} />
      )}
    </div>
  );
};

export { EntityOverlayContent };
