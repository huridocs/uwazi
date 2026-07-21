import React from 'react';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { RelationshipsActionBar } from '#V2/Routes/Entity/Components/relationships/index.js';
import { useRelationshipsSelectionState } from '#V2/Routes/Entity/Components/context/index.js';

const RelationshipsTabFooter = () => {
  const { relationshipsEditMode: editMode, selectedRelationshipIds: selected } =
    useRelationshipsSelectionState();
  const highlighted = editMode && selected.size > 0;

  return (
    <EntityTabFooter highlighted={highlighted}>
      <RelationshipsActionBar />
    </EntityTabFooter>
  );
};

export { RelationshipsTabFooter };
