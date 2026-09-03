/* eslint-disable react/no-multi-comp */
import React, { createContext, useContext, useMemo } from 'react';
import type {
  EntityMainTabsState,
  EntitySideTabsState,
  EntityTabsState,
} from './hooks/entityTabsTypes.js';

const noop = () => undefined;

const EMPTY_SIDE_TABS: EntitySideTabsState = {
  activeSideTab: undefined,
  explicitSideTab: undefined,
  syncSideTabId: undefined,
  sideButtons: [],
  onSideTabChange: noop,
};

const EntityMainTabsContext = createContext<EntityMainTabsState | null>(null);
const EntitySideTabsContext = createContext<EntitySideTabsState>(EMPTY_SIDE_TABS);

const EntityMainTabsProvider = ({
  value,
  children,
}: {
  value: EntityMainTabsState;
  children: React.ReactNode;
}) => <EntityMainTabsContext.Provider value={value}>{children}</EntityMainTabsContext.Provider>;

const EntitySideTabsProvider = ({
  value,
  children,
}: {
  value: EntitySideTabsState;
  children: React.ReactNode;
}) => <EntitySideTabsContext.Provider value={value}>{children}</EntitySideTabsContext.Provider>;

const EntityTabsProvider = ({
  value,
  children,
}: {
  value: EntityTabsState;
  children: React.ReactNode;
}) => {
  const main = useMemo(
    (): EntityMainTabsState => ({
      activeMainTab: value.activeMainTab,
      relationshipsOnMain: value.relationshipsOnMain,
      documentOnMain: value.documentOnMain,
      onMainTabChange: value.onMainTabChange,
      focusSideTab: value.focusSideTab,
      stageSideTab: value.stageSideTab,
      focusRelationshipsPanel: value.focusRelationshipsPanel,
      focusDocumentPanel: value.focusDocumentPanel,
    }),
    [
      value.activeMainTab,
      value.documentOnMain,
      value.focusDocumentPanel,
      value.focusRelationshipsPanel,
      value.focusSideTab,
      value.onMainTabChange,
      value.relationshipsOnMain,
      value.stageSideTab,
    ]
  );
  const side = useMemo(
    (): EntitySideTabsState => ({
      activeSideTab: value.activeSideTab,
      explicitSideTab: value.explicitSideTab,
      syncSideTabId: value.syncSideTabId,
      sideButtons: value.sideButtons,
      onSideTabChange: value.onSideTabChange,
    }),
    [
      value.activeSideTab,
      value.explicitSideTab,
      value.onSideTabChange,
      value.sideButtons,
      value.syncSideTabId,
    ]
  );
  return (
    <EntityMainTabsProvider value={main}>
      <EntitySideTabsProvider value={side}>{children}</EntitySideTabsProvider>
    </EntityMainTabsProvider>
  );
};

const useEntityTabNavigation = () => {
  const value = useContext(EntityMainTabsContext);
  if (!value) {
    throw new Error('useEntityTabNavigation must be used within EntityMainTabsProvider');
  }
  return value;
};

export {
  EMPTY_SIDE_TABS,
  EntityMainTabsProvider,
  EntitySideTabsProvider,
  EntityTabsProvider,
  useEntityTabNavigation,
};
