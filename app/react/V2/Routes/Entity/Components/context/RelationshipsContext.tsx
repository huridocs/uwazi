import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { formatRelationships } from '#V2/formatters/relationships/formatRelationships.js';
import type { RelationshipView } from '#V2/formatters/relationships/types.js';
import { useEntityScopedEntity } from './EntityContext.js';
import type { ReferenceMode, TextSelection } from './types.js';

type RelationshipsState = {
  relationships: RelationshipView[];
  createReferenceSelection: TextSelection | undefined;
  createReferenceMode: ReferenceMode | undefined;
};

type RelationshipsActions = {
  setCreateReferenceSelection: (selection: TextSelection | undefined, mode?: ReferenceMode) => void;
};

const RelationshipsStateContext = createContext<RelationshipsState | null>(null);
const RelationshipsActionsContext = createContext<RelationshipsActions | null>(null);

const RelationshipsProvider = ({ children }: { children: React.ReactNode }) => {
  const entity = useEntityScopedEntity();
  const [relationships, setRelationships] = useState(() => formatRelationships(entity));
  const [createReferenceSelection, setCreateReferenceSelectionState] = useState<TextSelection>();
  const [createReferenceMode, setCreateReferenceMode] = useState<ReferenceMode>();

  useEffect(() => {
    setRelationships(formatRelationships(entity));
  }, [entity]);

  const setCreateReferenceSelection = useCallback(
    (selection: TextSelection | undefined, mode?: ReferenceMode) => {
      setCreateReferenceSelectionState(selection);
      setCreateReferenceMode(mode);
    },
    []
  );

  const state = useMemo(
    () => ({ relationships, createReferenceSelection, createReferenceMode }),
    [relationships, createReferenceSelection, createReferenceMode]
  );

  const actions = useMemo(() => ({ setCreateReferenceSelection }), [setCreateReferenceSelection]);

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
