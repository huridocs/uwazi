import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { mergeTabGroup, type TabGroupsState } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { getSideTabButtons, type FilesSideTabsOptions } from '../sideTabSets.js';
import { isValidMainTab, isValidSideTab, type MainTabId } from '../tabIds.js';
import { resolveSideTabId, type SideTabButton } from './resolveSideTabId.js';

type SetSearchParams = ReturnType<typeof useSearchParams>[1];

type UseEntityTabUrlSyncParams = {
  entity: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  filesSideTabs: FilesSideTabsOptions;
  activeMainTab: MainTabId;
  mainTabIds: Set<MainTabId>;
  sideTabButtons: SideTabButton[];
  preferSearch: boolean;
  searchParams: URLSearchParams;
  setSearchParams: SetSearchParams;
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
  preferSearch,
  searchParams,
  setSearchParams,
  setTabGroups,
}: UseEntityTabUrlSyncParams) => {
  const previousSharedId = useRef(entity.sharedId);
  const mainTabParam = searchParams.get(MAIN_TAB_PARAM);
  const sideTabParam = searchParams.get(SIDE_TAB_PARAM);

  useEffect(() => {
    if (previousSharedId.current === entity.sharedId) return;
    previousSharedId.current = entity.sharedId;
    setTabGroups(prev => {
      const { 'entity-main': _main, 'entity-side': _side, ...rest } = prev;
      return rest;
    });
  }, [entity.sharedId, setTabGroups]);

  useEffect(() => {
    const syncTabsFromParams = (params: URLSearchParams) => {
      const mainFromUrl = params.get(MAIN_TAB_PARAM);
      const mainId =
        isValidMainTab(mainFromUrl) && mainTabIds.has(mainFromUrl) ? mainFromUrl : activeMainTab;
      const sideButtons = getSideTabButtons({
        activeMainTab: mainId,
        entity,
        hasMainDocument,
        mainDocumentId,
        filesSideTabs,
      });
      const sideId = resolveSideTabId(params.get(SIDE_TAB_PARAM), sideButtons, preferSearch);

      setTabGroups(prev => {
        let next = mergeTabGroup(prev, 'entity-main', { activeTabId: mainId });
        if (sideId) {
          next = mergeTabGroup(next, 'entity-side', { activeTabId: sideId });
        }
        return next;
      });
    };

    syncTabsFromParams(searchParams);
    const onPopState = () => {
      syncTabsFromParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [
    entity,
    activeMainTab,
    mainTabParam,
    sideTabParam,
    searchParams,
    hasMainDocument,
    mainDocumentId,
    filesSideTabs,
    mainTabIds,
    preferSearch,
    setTabGroups,
  ]);

  useEffect(() => {
    const raw = searchParams.get(SIDE_TAB_PARAM);
    if (!raw || !isValidSideTab(raw)) return;
    if (sideTabButtons.some(button => button.id === raw)) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete(SIDE_TAB_PARAM);
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [searchParams, activeMainTab, sideTabButtons, setSearchParams]);

  useEffect(() => {
    const raw = searchParams.get(MAIN_TAB_PARAM);
    if (!raw || !isValidMainTab(raw)) return;
    if (mainTabIds.has(raw)) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete(MAIN_TAB_PARAM);
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [searchParams, mainTabIds, setSearchParams]);
};

export { useEntityTabUrlSync };
