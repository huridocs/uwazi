import { atom, useAtomValue, useAtom } from 'jotai';
import { atomWithReset, useResetAtom } from 'jotai/utils';
import { EntityReference } from 'app/V2/domain/entities/types';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';

export type ReferenceMode = 'entity' | 'text';

type ReferencesState = {
  references: EntityReference[] | undefined;
  createReferenceSelection: TextSelection | undefined;
  createReferenceMode: ReferenceMode | undefined;
  // Add other reference-related state here as needed
};

// Base state atom
const referencesStateAtom = atomWithReset<ReferencesState>({
  references: undefined,
  createReferenceSelection: undefined,
  createReferenceMode: undefined,
});

// Action atoms
const referencesActions = {
  setReferences: atom(null, (get, set, references: EntityReference[] | undefined) => {
    const current = get(referencesStateAtom);
    set(referencesStateAtom, {
      ...current,
      references,
    });
  }),

  createReference: atom(
    null,
    (
      get,
      set,
      referenceData: {
        selection: TextSelection;
        targetEntityId?: string;
        relationshipType?: string;
        // Additional data needed for creating the reference
      }
    ) => {
      // TODO: Implement actual reference creation via API
      // For now, this is a placeholder that will be implemented when the API is ready
      const current = get(referencesStateAtom);
      // Clear the createReferenceSelection after creating
      set(referencesStateAtom, {
        ...current,
        createReferenceSelection: undefined,
      });
      // The actual reference will be added to the list after API call succeeds
    }
  ),

  setCreateReferenceSelection: atom(
    null,
    (get, set, selection: TextSelection | undefined, mode?: ReferenceMode) => {
      const current = get(referencesStateAtom);
      set(referencesStateAtom, {
        ...current,
        createReferenceSelection: selection,
        createReferenceMode: mode,
      });
    }
  ),

  deleteReference: atom(null, (get, set, referenceId: string) => {
    const current = get(referencesStateAtom);
    if (!current.references) return;
    const updated = current.references.filter(ref => ref._id !== referenceId);
    set(referencesStateAtom, {
      ...current,
      references: updated,
    });
  }),
};

// Custom hook to access References state only (doesn't cause rerenders when actions are called)
export function useReferences() {
  return useAtomValue(referencesStateAtom);
}

// Custom hook to access References actions only (doesn't subscribe to state changes)
export function useReferencesActions() {
  const [, setReferences] = useAtom(referencesActions.setReferences);
  const [, createReference] = useAtom(referencesActions.createReference);
  const [, setCreateReferenceSelection] = useAtom(referencesActions.setCreateReferenceSelection);
  const [, deleteReference] = useAtom(referencesActions.deleteReference);
  const reset = useResetAtom(referencesStateAtom);

  return {
    setReferences,
    createReference,
    setCreateReferenceSelection,
    deleteReference,
    reset,
  };
}

// Export statements
export { referencesStateAtom, referencesActions };
