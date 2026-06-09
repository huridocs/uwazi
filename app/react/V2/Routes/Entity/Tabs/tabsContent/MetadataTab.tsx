import React from 'react';
import { useAtom } from 'jotai';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EditEntity } from '#V2/Components/Metadata/EntityEditor/index.js';
import { isEditingAtom } from '../../atoms/isEditingAtom.js';

type MetadataTabProps = {
  entity: Entity;
};

const MetadataTab = ({ entity }: MetadataTabProps) => {
  const [isEditing, setIsEditing] = useAtom(isEditingAtom);

  const onSave = (editedEntity?: Entity) => {
    console.log(editedEntity);
    setIsEditing(false);
  };

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto p-3">
      <MetadataDisplay entity={entity} />
      {!isEditing && <MetadataDisplay entity={entity} />}
      {isEditing && <EditEntity formId="edit-entity-form" entity={entity} onSave={onSave} />}
    </div>
  );
};

export { MetadataTab };
