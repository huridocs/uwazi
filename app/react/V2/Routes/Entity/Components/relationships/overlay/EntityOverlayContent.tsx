import React from 'react';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/TemplateLabel.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
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
}: EntityOverlayContentProps) => (
  <div className="flex-1 space-y-4 overflow-auto p-4">
    <TemplateLabel templateId={entity.template} />
    <section className="space-y-3 rounded-lg bg-warm p-3">
      <MetadataDisplay entity={entity} />
    </section>
    {referenceMarkers.length > 0 && (
      <EntityOverlayReferences markers={referenceMarkers} selfSharedId={selfSharedId} />
    )}
  </div>
);

export { EntityOverlayContent };
