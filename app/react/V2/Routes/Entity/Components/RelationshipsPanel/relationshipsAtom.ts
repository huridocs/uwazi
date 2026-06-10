import { atom, useAtomValue, useAtom } from 'jotai';
import { atomWithReset, useResetAtom } from 'jotai/utils';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { RelationshipView } from '#V2/formatters/relationships/types.js';

type ReferenceMode = 'entity' | 'text';

type RelationshipsState = {
  relationships: RelationshipView[] | undefined;
  createReferenceSelection: TextSelection | undefined;
  createReferenceMode: ReferenceMode | undefined;
};

const relationshipsStateAtom = atomWithReset<RelationshipsState>({
  relationships: undefined,
  createReferenceSelection: undefined,
  createReferenceMode: undefined,
});

const relationshipsActions = {
  setRelationships: atom(null, (get, set, relationships: RelationshipView[] | undefined) => {
    const current = get(relationshipsStateAtom);
    set(relationshipsStateAtom, { ...current, relationships });
  }),

  setCreateReferenceSelection: atom(
    null,
    (get, set, selection: TextSelection | undefined, mode?: ReferenceMode) => {
      const current = get(relationshipsStateAtom);
      set(relationshipsStateAtom, {
        ...current,
        createReferenceSelection: selection,
        createReferenceMode: mode,
      });
    }
  ),

  deleteRelationship: atom(null, (get, set, relationshipId: string) => {
    const current = get(relationshipsStateAtom);
    if (!current.relationships) return;
    const updated = current.relationships.filter(r => r._id !== relationshipId);
    set(relationshipsStateAtom, { ...current, relationships: updated });
  }),
};

export function useRelationships() {
  return useAtomValue(relationshipsStateAtom);
}

export function useRelationshipsActions() {
  const [, setRelationships] = useAtom(relationshipsActions.setRelationships);
  const [, setCreateReferenceSelection] = useAtom(relationshipsActions.setCreateReferenceSelection);
  const [, deleteRelationship] = useAtom(relationshipsActions.deleteRelationship);
  const reset = useResetAtom(relationshipsStateAtom);

  return { setRelationships, setCreateReferenceSelection, deleteRelationship, reset };
}

export type { ReferenceMode };
export { relationshipsStateAtom, relationshipsActions };
