import React, { createContext, useContext, useMemo, useState } from 'react';

type RelationshipsSelectionState = {
  relationshipsEditMode: boolean;
  selectedRelationshipIds: Set<string>;
};

type RelationshipsSelectionActions = {
  setRelationshipsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedRelationshipIds: React.Dispatch<React.SetStateAction<Set<string>>>;
};

const RelationshipsSelectionStateContext = createContext<RelationshipsSelectionState | null>(null);
const RelationshipsSelectionActionsContext = createContext<RelationshipsSelectionActions | null>(
  null
);

const RelationshipsSelectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [relationshipsEditMode, setRelationshipsEditMode] = useState(false);
  const [selectedRelationshipIds, setSelectedRelationshipIds] = useState(new Set<string>());

  const state = useMemo(
    () => ({ relationshipsEditMode, selectedRelationshipIds }),
    [relationshipsEditMode, selectedRelationshipIds]
  );

  const actions = useMemo(
    () => ({ setRelationshipsEditMode, setSelectedRelationshipIds }),
    [setRelationshipsEditMode, setSelectedRelationshipIds]
  );

  return (
    <RelationshipsSelectionActionsContext.Provider value={actions}>
      <RelationshipsSelectionStateContext.Provider value={state}>
        {children}
      </RelationshipsSelectionStateContext.Provider>
    </RelationshipsSelectionActionsContext.Provider>
  );
};

const useRelationshipsSelectionState = () => {
  const context = useContext(RelationshipsSelectionStateContext);
  if (!context) throw new Error('Relationships selection state context not found');
  return context;
};

const useRelationshipsSelectionActions = () => {
  const context = useContext(RelationshipsSelectionActionsContext);
  if (!context) throw new Error('Relationships selection actions context not found');
  return context;
};

const useRelationshipsSelection = () => ({
  ...useRelationshipsSelectionState(),
  ...useRelationshipsSelectionActions(),
});

export {
  RelationshipsSelectionProvider,
  useRelationshipsSelection,
  useRelationshipsSelectionState,
  useRelationshipsSelectionActions,
};
