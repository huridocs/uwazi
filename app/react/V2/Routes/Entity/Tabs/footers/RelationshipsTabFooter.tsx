import React from 'react';
import { useAtomValue } from 'jotai';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { RelationshipsActionBar } from '../../Components/RelationshipsPanel/RelationshipsActionBar.js';
import {
  relationshipsEditModeAtom,
  selectedRelationshipIdsAtom,
} from '../../Components/RelationshipsPanel/relationshipsAtom.js';

const RelationshipsTabFooter = () => {
  const editMode = useAtomValue(relationshipsEditModeAtom);
  const selected = useAtomValue(selectedRelationshipIdsAtom);
  const highlighted = editMode && selected.size > 0;

  return (
    <EntityTabFooter highlighted={highlighted}>
      <RelationshipsActionBar />
    </EntityTabFooter>
  );
};

export { RelationshipsTabFooter };
