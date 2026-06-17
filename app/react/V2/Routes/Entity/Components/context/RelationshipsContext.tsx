import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { RelationshipView } from '#V2/formatters/relationships/types.js';
import type { ReferenceMode, TextSelection } from './types.js';

type RelationshipsState = {
  relationships: RelationshipView[] | undefined;
  createReferenceSelection: TextSelection | undefined;
  createReferenceMode: ReferenceMode | undefined;
};

type RelationshipsActions = {
  setRelationships: (relationships: RelationshipView[] | undefined) => void;
  setCreateReferenceSelection: (selection: TextSelection | undefined, mode?: ReferenceMode) => void;
  deleteRelationship: (relationshipId: string) => void;
  reset: () => void;
};

const RelationshipsStateContext = createContext<RelationshipsState | null>(null);
const RelationshipsActionsContext = createContext<RelationshipsActions | null>(null);

const RelationshipsProvider = ({ children }: { children: React.ReactNode }) => {
  const [relationships, setRelationships] = useState<RelationshipView[] | undefined>();
  const [createReferenceSelection, setCreateReferenceSelectionState] = useState<TextSelection>();
  const [createReferenceMode, setCreateReferenceMode] = useState<ReferenceMode>();

  const setCreateReferenceSelection = useCallback(
    (selection: TextSelection | undefined, mode?: ReferenceMode) => {
      setCreateReferenceSelectionState(selection);
      setCreateReferenceMode(mode);
    },
    []
  );

  const deleteRelationship = useCallback((relationshipId: string) => {
    setRelationships(current => current?.filter(item => item._id !== relationshipId));
  }, []);

  const reset = useCallback(() => {
    setRelationships(undefined);
    setCreateReferenceSelectionState(undefined);
    setCreateReferenceMode(undefined);
  }, []);

  const state = useMemo(
    () => ({ relationships, createReferenceSelection, createReferenceMode }),
    [relationships, createReferenceSelection, createReferenceMode]
  );

  const actions = useMemo(
    () => ({ setRelationships, setCreateReferenceSelection, deleteRelationship, reset }),
    [setCreateReferenceSelection, deleteRelationship, reset]
  );

  return (
    <RelationshipsActionsContext.Provider value={actions}>
      <RelationshipsStateContext.Provider value={state}>
        {children}
      </RelationshipsStateContext.Provider>
    </RelationshipsActionsContext.Provider>
  );
};

const useRelationshipsStateContext = () => {
  const context = useContext(RelationshipsStateContext);
  if (!context) throw new Error('Relationships state context not found');
  return context;
};

const useRelationshipsActionsContext = () => {
  const context = useContext(RelationshipsActionsContext);
  if (!context) throw new Error('Relationships actions context not found');
  return context;
};

const useRelationships = () => useRelationshipsStateContext();
const useRelationshipsActions = () => useRelationshipsActionsContext();

export { RelationshipsProvider, useRelationships, useRelationshipsActions };
