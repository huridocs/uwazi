import { useEffect, useRef } from 'react';
import { mergeTabGroup, type TabGroupsState } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { getSideTabButtons, type FilesSideTabsOptions } from '../sideTabSets.js';
import { MAIN_TAB, isValidMainTab, isValidSideTab, type MainTabId } from '../tabIds.js';
import { resolveSideTabId, type SideTabButton } from './resolveSideTabId.js';

type UseEntityTabUrlSyncParams = {
  entity: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  filesSideTabs: FilesSideTabsOptions;
  activeMainTab: MainTabId;
  mainTabIds: Set<MainTabId>;
  sideTabButtons: SideTabButton[];
  searchParams: URLSearchParams;
  hashParams: URLSearchParams;
  setTabGroups: (updater: (prev: TabGroupsState) => TabGroupsState) => void;
};

const useEntityTabUrlSync = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
  activeMainTab,
  mainTabIds,
  sideTabButtons,
  searchParams,
  hashParams,
  setTabGroups,
}: UseEntityTabUrlSyncParams) => {
  const updateEntityUrl = useUpdateEntityUrl();
  const previousSharedId = useRef(entity.sharedId);
  const mainTabParam = searchParams.get(MAIN_TAB_PARAM);
  const sideTabParam = hashParams.get(SIDE_TAB_PARAM);

  useEffect(() => {
    if (previousSharedId.current === entity.sharedId) return;
    previousSharedId.current = entity.sharedId;
    setTabGroups(prev => {
      const { 'entity-main': _main, 'entity-side': _side, ...rest } = prev;
      return rest;
    });
  }, [entity.sharedId, setTabGroups]);

  useEffect(() => {
    const syncTabsFromParams = (mainParams: URLSearchParams, sideParams: URLSearchParams) => {
      const mainFromUrl = mainParams.get(MAIN_TAB_PARAM);
      const mainId =
        isValidMainTab(mainFromUrl) && mainTabIds.has(mainFromUrl) ? mainFromUrl : activeMainTab;
      const sideButtons = getSideTabButtons({
        activeMainTab: mainId,
        entity,
        hasMainDocument,
        mainDocumentId,
        filesSideTabs,
      });
      const sideId = resolveSideTabId(sideParams.get(SIDE_TAB_PARAM), sideButtons);

      setTabGroups(prev => {
        let next = mergeTabGroup(prev, 'entity-main', { activeTabId: mainId });
        if (sideId) {
          next = mergeTabGroup(next, 'entity-side', { activeTabId: sideId });
        }
        return next;
      });
    };

    syncTabsFromParams(searchParams, hashParams);
  }, [
    entity,
    activeMainTab,
    mainTabParam,
    sideTabParam,
    searchParams,
    hashParams,
    hasMainDocument,
    mainDocumentId,
    filesSideTabs,
    mainTabIds,
    setTabGroups,
  ]);

  useEffect(() => {
    const raw = hashParams.get(SIDE_TAB_PARAM);
    if (!raw || !isValidSideTab(raw)) return;
    if (sideTabButtons.some(button => button.id === raw)) return;
    updateEntityUrl({
      hash: next => {
        next.delete(SIDE_TAB_PARAM);
      },
    });
  }, [hashParams, activeMainTab, sideTabButtons, updateEntityUrl]);

  useEffect(() => {
    const raw = searchParams.get(MAIN_TAB_PARAM);
    if (!raw || !isValidMainTab(raw)) return;
    if (raw === MAIN_TAB.DOCUMENT && hasMainDocument) {
      updateEntityUrl({
        search: next => {
          next.delete(MAIN_TAB_PARAM);
        },
      });
      return;
    }
    if (mainTabIds.has(raw)) return;
    updateEntityUrl({
      search: next => {
        next.delete(MAIN_TAB_PARAM);
      },
    });
  }, [searchParams, mainTabIds, hasMainDocument, updateEntityUrl]);
};

export { useEntityTabUrlSync };
