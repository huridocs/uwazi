import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TextSelection } from './types.js';

type RelationshipsState = {
  createReferenceSelection: TextSelection | undefined;
  createRelationshipModalOpen: boolean;
  manageRelationTypesOpen: boolean;
};

type RelationshipsActions = {
  openCreateRelationship: (selection?: TextSelection) => void;
  closeCreateRelationship: () => void;
  openManageRelationTypes: () => void;
  closeManageRelationTypes: () => void;
};

const RelationshipsStateContext = createContext<RelationshipsState | null>(null);
const RelationshipsActionsContext = createContext<RelationshipsActions | null>(null);

const RelationshipsProvider = ({ children }: { children: React.ReactNode }) => {
  const [createReferenceSelection, setCreateReferenceSelection] = useState<TextSelection>();
  const [createRelationshipModalOpen, setCreateRelationshipModalOpen] = useState(false);
  const [manageRelationTypesOpen, setManageRelationTypesOpen] = useState(false);

  const openCreateRelationship = useCallback((selection?: TextSelection) => {
    setCreateReferenceSelection(selection);
    setCreateRelationshipModalOpen(true);
  }, []);

  const closeCreateRelationship = useCallback(() => {
    setCreateRelationshipModalOpen(false);
    setCreateReferenceSelection(undefined);
  }, []);

  const openManageRelationTypes = useCallback(() => {
    setManageRelationTypesOpen(true);
  }, []);

  const closeManageRelationTypes = useCallback(() => {
    setManageRelationTypesOpen(false);
  }, []);

  const state = useMemo(
    () => ({ createReferenceSelection, createRelationshipModalOpen, manageRelationTypesOpen }),
    [createReferenceSelection, createRelationshipModalOpen, manageRelationTypesOpen]
  );

  const actions = useMemo(
    () => ({
      openCreateRelationship,
      closeCreateRelationship,
      openManageRelationTypes,
      closeManageRelationTypes,
    }),
    [
      openCreateRelationship,
      closeCreateRelationship,
      openManageRelationTypes,
      closeManageRelationTypes,
    ]
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
