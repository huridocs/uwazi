import React from 'react';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { RelationshipsPanel } from '../../Components/RelationshipsPanel/RelationshipsPanel.js';

type RelationshipsSideTabProps = {
  entity?: EntityType;
  mainDocument?: FileType;
};

const RelationshipsSideTab = ({ entity, mainDocument }: RelationshipsSideTabProps) => (
  <div className="min-h-0 flex-1 overflow-y-auto [&_.panel]:border-0">
    <RelationshipsPanel entity={entity} mainDocument={mainDocument} />
  </div>
);

export { RelationshipsSideTab };
