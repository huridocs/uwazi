import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { RelationshipType } from '#shared/contracts/RelationshipType.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import { useServices } from './ServicesProvider.js';

type CreateRelationshipTypeResult =
  | { status: 'duplicate' }
  | { status: 'created'; type: RelationshipType }
  | { status: 'error'; message: string };

type DeleteRelationshipTypeResult = { status: 'deleted' } | { status: 'error'; message: string };

const useRelationshipTypeMutations = () => {
  const { relationshipTypes: relationshipTypesService } = useServices();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const setRelationshipTypes = useSetAtom(relationshipTypesAtom);

  const create = useCallback(
    async (name: string): Promise<CreateRelationshipTypeResult> => {
      const trimmed = name.trim();
      const isDuplicate = relationshipTypes.some(
        type => type.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (isDuplicate) {
        return { status: 'duplicate' };
      }

      const [created, error] = await relationshipTypesService.upsert({ name: trimmed });
      if (error || !created) {
        const message = error?.detail ?? error?.message ?? 'An error occurred';
        return { status: 'error', message };
      }

      setRelationshipTypes(prev => [...prev, created]);
      return { status: 'created', type: created };
    },
    [relationshipTypes, relationshipTypesService, setRelationshipTypes]
  );

  const deleteType = useCallback(
    async (id: string): Promise<DeleteRelationshipTypeResult> => {
      const [, error] = await relationshipTypesService.delete([id]);
      if (error) {
        return { status: 'error', message: error.detail ?? error.message };
      }
      setRelationshipTypes(prev => prev.filter(type => type._id !== id));
      return { status: 'deleted' };
    },
    [relationshipTypesService, setRelationshipTypes]
  );

  return { create, delete: deleteType };
};

export { useRelationshipTypeMutations };
export type { CreateRelationshipTypeResult, DeleteRelationshipTypeResult };
