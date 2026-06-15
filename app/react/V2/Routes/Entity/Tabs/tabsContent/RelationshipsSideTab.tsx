import React from 'react';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { RelationshipsPanel } from '../../Components/RelationshipsPanel/RelationshipsPanel.js';

type RelationshipsSideTabProps = {
  entity?: EntityType;
  mainDocument?: FileType;
};

const RelationshipsSideTab = ({ entity, mainDocument }: RelationshipsSideTabProps) => (
  <div className="flex h-full min-h-0 flex-col [&_.panel]:h-full [&_.panel]:border-0">
    <RelationshipsPanel entity={entity} mainDocument={mainDocument} />
  </div>
);

export { RelationshipsSideTab };
