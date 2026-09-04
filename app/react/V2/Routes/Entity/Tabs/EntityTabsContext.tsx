/* eslint-disable react/no-multi-comp */
import React, { createContext, useContext, useMemo } from 'react';
import type { TabButtonDef } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import type { FilesSideTabsOptions } from './sideTabSets.js';
import type { MainTabId, SideTabId } from './tabIds.js';

type UseEntityTabsParams = {
  entity: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  filesSideTabs: FilesSideTabsOptions;
};

type EntityMainTabsState = {
  activeMainTab: MainTabId;
  relationshipsOnMain: boolean;
  documentOnMain: boolean;
  onMainTabChange: (selectedMainTab: string) => void;
  focusSideTab: (sideTab: SideTabId) => void;
  stageSideTab: (sideTab: SideTabId) => void;
  focusRelationshipsPanel: () => void;
  focusDocumentPanel: () => void;
};

type EntitySideTabsState = {
  activeSideTab: SideTabId | undefined;
  syncSideTabId: SideTabId | undefined;
  sideButtons: TabButtonDef[];
  onSideTabChange: (selectedSideTab: string) => void;
};

type EntityTabsState = EntityMainTabsState & EntitySideTabsState;

const EntityMainTabsContext = createContext<EntityMainTabsState | null>(null);

const EntityMainTabsProvider = ({
  value,
  children,
}: {
  value: EntityMainTabsState;
  children: React.ReactNode;
}) => <EntityMainTabsContext.Provider value={value}>{children}</EntityMainTabsContext.Provider>;

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
  return <EntityMainTabsProvider value={main}>{children}</EntityMainTabsProvider>;
};

const useEntityTabNavigation = () => {
  const value = useContext(EntityMainTabsContext);
  if (!value) {
    throw new Error('useEntityTabNavigation must be used within EntityMainTabsProvider');
  }
  return value;
};

export { EntityMainTabsProvider, EntityTabsProvider, useEntityTabNavigation };
export type { EntityMainTabsState, EntitySideTabsState, EntityTabsState, UseEntityTabsParams };
