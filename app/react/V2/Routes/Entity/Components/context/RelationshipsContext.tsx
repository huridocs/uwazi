import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReferenceMode, TextSelection } from './types.js';

type RelationshipsState = {
  createReferenceSelection: TextSelection | undefined;
  createReferenceMode: ReferenceMode | undefined;
};

type RelationshipsActions = {
  setCreateReferenceSelection: (selection: TextSelection | undefined, mode?: ReferenceMode) => void;
};

const RelationshipsStateContext = createContext<RelationshipsState | null>(null);
const RelationshipsActionsContext = createContext<RelationshipsActions | null>(null);

const RelationshipsProvider = ({ children }: { children: React.ReactNode }) => {
  const [createReferenceSelection, setCreateReferenceSelectionState] = useState<TextSelection>();
  const [createReferenceMode, setCreateReferenceMode] = useState<ReferenceMode>();

  const setCreateReferenceSelection = useCallback(
    (selection: TextSelection | undefined, mode?: ReferenceMode) => {
      setCreateReferenceSelectionState(selection);
      setCreateReferenceMode(mode);
    },
    []
  );

  const state = useMemo(
    () => ({ createReferenceSelection, createReferenceMode }),
    [createReferenceSelection, createReferenceMode]
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
