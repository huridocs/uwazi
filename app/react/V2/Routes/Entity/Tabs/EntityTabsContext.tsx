import React, { createContext, useContext } from 'react';
import type { EntityTabsState } from './hooks/useEntityTabs.js';

const EntityTabsContext = createContext<EntityTabsState | null>(null);

const EntityTabsProvider = ({
  value,
  children,
}: {
  value: EntityTabsState;
  children: React.ReactNode;
}) => <EntityTabsContext.Provider value={value}>{children}</EntityTabsContext.Provider>;

const useEntityTabsContext = (): EntityTabsState => {
  const value = useContext(EntityTabsContext);
  if (!value) {
    throw new Error('useEntityTabsContext must be used within EntityTabsProvider');
  }
  return value;
};

const useEntityTabNavigation = () => {
  const {
    activeMainTab,
    relationshipsOnMain,
    documentOnMain,
    focusSideTab,
    focusRelationshipsPanel,
    focusDocumentPanel,
  } = useEntityTabsContext();
  return {
    activeMainTab,
    relationshipsOnMain,
    documentOnMain,
    focusSideTab,
    focusRelationshipsPanel,
    focusDocumentPanel,
  };
};

export { EntityTabsProvider, useEntityTabsContext, useEntityTabNavigation };
