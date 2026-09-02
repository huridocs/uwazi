import React from 'react';
import { MetadataRecord } from '#V2/Components/Metadata/MetadataRecord.js';
import type { Entity } from '#V2/api/entities/types.js';
import { useEntityOverlay } from '#V2/Routes/Entity/Components/context/index.js';

type EntityOverlayContentProps = {
  entity: Entity;
};

const EntityOverlayContent = ({ entity }: EntityOverlayContentProps) => {
  const { openEntityOverlayTarget } = useEntityOverlay();

  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-3 py-3 pb-8">
      <MetadataRecord entity={entity} onOpenEntity={openEntityOverlayTarget} showDocumentPreview />
    </div>
  );
};

export { EntityOverlayContent };
