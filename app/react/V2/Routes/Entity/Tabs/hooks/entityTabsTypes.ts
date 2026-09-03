import type { TabButtonDef } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import type { FilesSideTabsOptions } from '../sideTabSets.js';
import type { MainTabId, SideTabId } from '../tabIds.js';

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
  explicitSideTab: SideTabId | undefined;
  syncSideTabId: SideTabId | undefined;
  sideButtons: TabButtonDef[];
  onSideTabChange: (selectedSideTab: string) => void;
};

type EntityTabsState = EntityMainTabsState & EntitySideTabsState;

export type { EntityMainTabsState, EntitySideTabsState, EntityTabsState, UseEntityTabsParams };
