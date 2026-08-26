import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { TabGroupsState } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { mergeTabGroup } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { resolveSideTabId } from '../entityTabState.js';
import { getSideTabButtons, type FilesSideTabsOptions } from '../sideTabSets.js';
import { isValidMainTab, type MainTabId, type SideTabId } from '../tabIds.js';

type UseEntityTabGroupsSyncParams = {
  entity: EntityType;
  activeMainTab: MainTabId;
  mainTabIds: Set<MainTabId>;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  filesSideTabs: FilesSideTabsOptions;
  metadataDirty: boolean;
  searchDirty: boolean;
  filesCount: number;
  relationshipsCount: number;
  hashParams: URLSearchParams;
  searchParams: URLSearchParams;
  pendingSideTabId: SideTabId | null;
  pendingSideTabRef: MutableRefObject<SideTabId | null>;
  setPendingSideTab: Dispatch<SetStateAction<SideTabId | null>>;
  setTabGroups: (update: (prev: TabGroupsState) => TabGroupsState) => void;
};

const useEntityTabGroupsSync = ({
  entity,
  activeMainTab,
  mainTabIds,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
  metadataDirty,
  searchDirty,
  filesCount,
  relationshipsCount,
  hashParams,
  searchParams,
  pendingSideTabId,
  pendingSideTabRef,
  setPendingSideTab,
  setTabGroups,
}: UseEntityTabGroupsSyncParams) => {
  const previousSharedId = useRef(entity.sharedId);

  useEffect(() => {
    if (previousSharedId.current === entity.sharedId) return;
    previousSharedId.current = entity.sharedId;
    pendingSideTabRef.current = null;
    setPendingSideTab(null);
    setTabGroups(prev => {
      const { 'entity-main': _main, 'entity-side': _side, ...rest } = prev;
      return rest;
    });
  }, [entity.sharedId, pendingSideTabRef, setPendingSideTab, setTabGroups]);

  useEffect(() => {
    setTabGroups(prev => {
      const mainFromUrl = searchParams.get(MAIN_TAB_PARAM);
      const mainId =
        isValidMainTab(mainFromUrl) && mainTabIds.has(mainFromUrl) ? mainFromUrl : activeMainTab;
      const sideButtonsForMain = getSideTabButtons({
        activeMainTab: mainId,
        entity,
        hasMainDocument,
        mainDocumentId,
        filesSideTabs,
        metadataDirty,
        searchDirty,
        filesCount,
        relationshipsCount,
      });
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
    entity,
    filesCount,
    filesSideTabs,
    hashParams,
    hasMainDocument,
    mainDocumentId,
    mainTabIds,
    metadataDirty,
    pendingSideTabId,
    relationshipsCount,
    searchDirty,
    searchParams,
    setTabGroups,
  ]);
};

export { useEntityTabGroupsSync };
