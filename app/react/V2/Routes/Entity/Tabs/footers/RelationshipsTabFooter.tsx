import React from 'react';
import { useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { RelationshipsActionBar } from '../../Components/RelationshipsPanel/RelationshipsActionBar.js';
import {
  relationshipsEditModeAtom,
  selectedRelationshipIdsAtom,
} from '../../Components/RelationshipsPanel/relationshipsAtom.js';

type RelationshipsTabFooterProps = {
  entity?: Entity;
};

const RelationshipsTabFooter = ({ entity }: RelationshipsTabFooterProps) => {
  const editMode = useAtomValue(relationshipsEditModeAtom);
  const selected = useAtomValue(selectedRelationshipIdsAtom);
  const highlighted = editMode && selected.size > 0;

  return (
    <EntityTabFooter highlighted={highlighted}>
      <RelationshipsActionBar entity={entity} />
    </EntityTabFooter>
  );
};

export { RelationshipsTabFooter };
