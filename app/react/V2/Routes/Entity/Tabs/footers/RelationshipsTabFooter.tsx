import React from 'react';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { RelationshipsActionBar } from '../../Components/RelationshipsPanel/RelationshipsActionBar.js';
import { useEntityScopedContext } from '../../Components/EntityScopedProvider.js';

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
