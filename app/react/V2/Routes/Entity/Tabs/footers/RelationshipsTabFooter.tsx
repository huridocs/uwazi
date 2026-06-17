import React from 'react';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { RelationshipsActionBar } from '../../Components/relationships/panel/RelationshipsActionBar.js';
import { useEntityScopedContext } from '../../Components/context/EntityScopedProvider.js';

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
