import React from 'react';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';

type MetadataTabProps = {
  entity: EntityType;
};

const MetadataTab = ({ entity }: MetadataTabProps) => (
  <div className="h-full min-h-0 flex-1 overflow-y-auto">
    <MetadataDisplay entity={entity} />
  </div>
);

export { MetadataTab };
