import React from 'react';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { RelationshipsActionBar } from '#V2/Routes/Entity/Components/relationships/index.js';
import { useEntityScopedContext } from '#V2/Routes/Entity/Components/context/index.js';

const RelationshipsTabFooter = () => {
  const { relationshipsEditMode: editMode, selectedRelationshipIds: selected } =
    useEntityScopedContext();
  const highlighted = editMode && selected.size > 0;

  return (
    <EntityTabFooter highlighted={highlighted}>
      <RelationshipsActionBar />
    </EntityTabFooter>
  );
};

export { RelationshipsTabFooter };
