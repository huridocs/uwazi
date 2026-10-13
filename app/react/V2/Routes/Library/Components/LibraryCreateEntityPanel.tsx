import React from 'react';
import { EntityProvider } from '#V2/Routes/Entity/Components/context/EntityContext.js';
import { MetadataEditingProvider } from '#V2/Routes/Entity/Components/context/MetadataEditingContext.js';
import { LibraryCreateEntityForm } from './LibraryCreateEntityForm.js';
import { useLibraryCreateEntity } from './useLibraryCreateEntity.js';

type LibraryCreateEntityPanelProps = {
  onClose: () => void;
  onCreated: (sharedId: string) => void;
};

const LibraryCreateEntityPanel = ({ onClose, onCreated }: LibraryCreateEntityPanelProps) => {
  const create = useLibraryCreateEntity(onCreated);

  return (
    <EntityProvider entity={create.entity}>
      <MetadataEditingProvider>
        <LibraryCreateEntityForm onClose={onClose} create={create} />
      </MetadataEditingProvider>
    </EntityProvider>
  );
};

export type { LibraryCreateEntityPanelProps };
export { LibraryCreateEntityPanel };
