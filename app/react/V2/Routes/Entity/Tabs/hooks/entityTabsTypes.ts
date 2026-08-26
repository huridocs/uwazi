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

type EntityTabsState = {
  activeMainTab: MainTabId;
  activeSideTab: SideTabId | undefined;
  explicitSideTab: SideTabId | undefined;
  syncSideTabId: SideTabId | undefined;
  sideButtons: TabButtonDef[];
  relationshipsOnMain: boolean;
  documentOnMain: boolean;
  onMainTabChange: (selectedMainTab: string) => void;
  onSideTabChange: (selectedSideTab: string) => void;
  focusSideTab: (sideTab: SideTabId) => void;
  focusRelationshipsPanel: () => void;
  focusDocumentPanel: () => void;
};

export type { EntityTabsState, UseEntityTabsParams };
