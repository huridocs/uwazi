import React from 'react';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EditEntity } from '#V2/Components/Metadata/EntityEditor/index.js';
import { useMetadataEditing } from '#V2/Routes/Entity/Components/context/index.js';

type MetadataTabProps = {
  entity: Entity;
};

const MetadataTab = ({ entity }: MetadataTabProps) => {
  const { isEditing, setIsEditing } = useMetadataEditing();

  const onSave = (_editedEntity?: Entity) => {
    setIsEditing(false);
  };

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto py-3">
      {!isEditing && <MetadataDisplay entity={entity} />}
      {isEditing && <EditEntity formId="edit-entity-form" entity={entity} onSave={onSave} />}
    </div>
  );
};

export { MetadataTab };
