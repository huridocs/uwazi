import React from 'react';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { ReferencesPanel } from '../../Components/ReferencesPanel/ReferencesPanel.js';

type ReferencesTabProps = {
  entity?: EntityType;
  mainDocument?: FileType;
};

const ReferencesTab = ({ entity, mainDocument }: ReferencesTabProps) => (
  <div className="min-h-0 flex-1 overflow-y-auto [&_.panel]:border-0">
    <ReferencesPanel entity={entity} mainDocument={mainDocument} />
  </div>
);

export { ReferencesTab };
