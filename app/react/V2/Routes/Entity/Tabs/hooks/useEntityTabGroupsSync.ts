import { useEffect, useRef } from 'react';
import {
  mergeTabGroup,
  type TabButtonDef,
  type TabGroupsState,
} from '#V2/Components/UI/Tabs/tabsAtoms.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { resolveSideTabId } from '../entityTabState.js';
import { isValidMainTab, type MainTabId, type SideTabId } from '../tabIds.js';

type UseEntityTabGroupsSyncParams = {
  entity: EntityType;
  activeMainTab: MainTabId;
  mainTabIds: Set<MainTabId>;
  buttonsFor: (mainTab: MainTabId, searchDirty: boolean) => TabButtonDef[];
  searchDirty: boolean;
  hashParams: URLSearchParams;
  searchParams: URLSearchParams;
  pendingSideTabId: SideTabId | null;
  clearPendingSideTab: () => void;
  setTabGroups: (update: (prev: TabGroupsState) => TabGroupsState) => void;
};

const useEntityTabGroupsSync = ({
  entity,
  activeMainTab,
  mainTabIds,
  buttonsFor,
  searchDirty,
  hashParams,
  searchParams,
  pendingSideTabId,
  clearPendingSideTab,
  setTabGroups,
}: UseEntityTabGroupsSyncParams) => {
  const previousSharedId = useRef(entity.sharedId);

  useEffect(() => {
    if (previousSharedId.current === entity.sharedId) return;
    previousSharedId.current = entity.sharedId;
    clearPendingSideTab();
    setTabGroups(prev => {
      const { 'entity-main': _main, 'entity-side': _side, ...rest } = prev;
      return rest;
    });
  }, [clearPendingSideTab, entity.sharedId, setTabGroups]);

  useEffect(() => {
    setTabGroups(prev => {
      const mainFromUrl = searchParams.get(MAIN_TAB_PARAM);
      const mainId =
        isValidMainTab(mainFromUrl) && mainTabIds.has(mainFromUrl) ? mainFromUrl : activeMainTab;
      const sideButtonsForMain = buttonsFor(mainId, searchDirty);
      const sideFromHash = hashParams.get(SIDE_TAB_PARAM);
      const sideId =
        pendingSideTabId && sideButtonsForMain.some(button => button.id === pendingSideTabId)
          ? pendingSideTabId
          : resolveSideTabId(sideFromHash, sideButtonsForMain, prev['entity-side']?.activeTabId);
      let next = mergeTabGroup(prev, 'entity-main', { activeTabId: mainId });
      if (sideId) {
        next = mergeTabGroup(next, 'entity-side', { activeTabId: sideId });
      }
      return next;
    });
  }, [
    activeMainTab,
    buttonsFor,
    hashParams,
    mainTabIds,
    pendingSideTabId,
    searchDirty,
    searchParams,
    setTabGroups,
  ]);
};

export { useEntityTabGroupsSync };
