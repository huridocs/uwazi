import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

type RelationshipsSelectionState = {
  relationshipsEditMode: boolean;
  selectedRelationshipIds: Set<string>;
};

type RelationshipsSelectionActions = {
  setRelationshipsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedRelationshipIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  syncRelationshipsTab: (id: string, active: boolean) => number;
};

const RelationshipsSelectionStateContext = createContext<RelationshipsSelectionState | null>(null);
const RelationshipsSelectionActionsContext = createContext<RelationshipsSelectionActions | null>(
  null
);

const RelationshipsSelectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [relationshipsEditMode, setRelationshipsEditMode] = useState(false);
  const [selectedRelationshipIds, setSelectedRelationshipIds] = useState(new Set<string>());
  const openTabs = useRef(new Set<string>());
  const syncRelationshipsTab = useCallback((id: string, active: boolean) => {
    if (active) openTabs.current.add(id);
    else openTabs.current.delete(id);
    return openTabs.current.size;
  }, []);

  const state = useMemo(
    () => ({ relationshipsEditMode, selectedRelationshipIds }),
    [relationshipsEditMode, selectedRelationshipIds]
  );

  const actions = useMemo(
    () => ({ setRelationshipsEditMode, setSelectedRelationshipIds, syncRelationshipsTab }),
    [setRelationshipsEditMode, setSelectedRelationshipIds, syncRelationshipsTab]
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

const useExitRelationshipsEdit = (active: boolean) => {
  const id = useId();
  const {
    relationshipsEditMode,
    syncRelationshipsTab,
    setRelationshipsEditMode,
    setSelectedRelationshipIds,
  } = useRelationshipsSelection();

  useEffect(() => {
    const openCount = syncRelationshipsTab(id, active);
    if (!active && openCount === 0 && relationshipsEditMode) {
      setRelationshipsEditMode(false);
      setSelectedRelationshipIds(new Set());
    }
    return () => {
      syncRelationshipsTab(id, false);
    };
  }, [
    active,
    id,
    relationshipsEditMode,
    setRelationshipsEditMode,
    setSelectedRelationshipIds,
    syncRelationshipsTab,
  ]);
};

export {
  RelationshipsSelectionProvider,
  useRelationshipsSelection,
  useRelationshipsSelectionState,
  useRelationshipsSelectionActions,
  useExitRelationshipsEdit,
};
