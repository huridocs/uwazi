import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TextSelection } from './types.js';

type RelationshipsState = {
  createReferenceSelection: TextSelection | undefined;
  createRelationshipModalOpen: boolean;
};

type RelationshipsActions = {
  openCreateRelationship: (selection?: TextSelection) => void;
  closeCreateRelationship: () => void;
};

const RelationshipsStateContext = createContext<RelationshipsState | null>(null);
const RelationshipsActionsContext = createContext<RelationshipsActions | null>(null);

const RelationshipsProvider = ({ children }: { children: React.ReactNode }) => {
  const [createReferenceSelection, setCreateReferenceSelection] = useState<TextSelection>();
  const [createRelationshipModalOpen, setCreateRelationshipModalOpen] = useState(false);

  const openCreateRelationship = useCallback((selection?: TextSelection) => {
    setCreateReferenceSelection(selection);
    setCreateRelationshipModalOpen(true);
  }, []);

  const closeCreateRelationship = useCallback(() => {
    setCreateRelationshipModalOpen(false);
    setCreateReferenceSelection(undefined);
  }, []);

  const state = useMemo(
    () => ({ createReferenceSelection, createRelationshipModalOpen }),
    [createReferenceSelection, createRelationshipModalOpen]
  );

  const actions = useMemo(
    () => ({ openCreateRelationship, closeCreateRelationship }),
    [openCreateRelationship, closeCreateRelationship]
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
