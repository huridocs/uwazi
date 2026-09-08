import { useCallback, useEffect, useMemo } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { tabGroupsAtom, type TabGroupsState } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { useTabGroup } from '#V2/Components/UI/index.js';
import {
  useEntityHashUiParams,
  useEntitySearchParams,
  useUpdateEntityUrl,
} from '../../entityUrlState.js';
import { SEARCH_PARAM } from '../../urlParams.js';
import type { EntitySideTabsState, UseEntityTabsParams } from '../EntityTabsContext.js';
import {
  getMainTabIds,
  pendingSideTabAtom,
  resolveExplicitSideTab,
  resolveMainTabFromUrl,
  resolveSideTabId,
  setEntitySideTabInUrl,
} from '../entityTabState.js';
import { isValidSideTab, type SideTabId } from '../tabIds.js';
import { useEntityTabGroupsSync } from './useEntityTabGroupsSync.js';
import { useEntityTabUrlSanitize } from './useEntityTabUrlSanitize.js';
import { useEntitySideButtonModel } from './useEntitySideButtonModel.js';

const useResolvedSideTabIds = (args: {
  hashParams: URLSearchParams;
  sideButtons: EntitySideTabsState['sideButtons'];
  pendingSideTab: SideTabId | null;
  atomSideTab: string;
}) => {
  const { hashParams, sideButtons, pendingSideTab, atomSideTab } = args;
  const explicitSideTab = useMemo(
    () => resolveExplicitSideTab(hashParams, sideButtons),
    [hashParams, sideButtons]
  );
  const activeSideTab = useMemo(() => {
    if (pendingSideTab) return pendingSideTab;
    if (explicitSideTab) return explicitSideTab;
    return resolveSideTabId(
      null,
      sideButtons,
      isValidSideTab(atomSideTab) ? atomSideTab : undefined
    );
  }, [atomSideTab, explicitSideTab, pendingSideTab, sideButtons]);
  return {
    explicitSideTab,
    activeSideTab,
    syncSideTabId: pendingSideTab ?? explicitSideTab,
  };
};

const useSideTabLists = (args: {
  hasMainDocument: boolean;
  searchParams: URLSearchParams;
  hashParams: URLSearchParams;
  buttonsFor: ReturnType<typeof useEntitySideButtonModel>['buttonsFor'];
}) => {
  const { hasMainDocument, searchParams, hashParams, buttonsFor } = args;
  const searchDirty = Boolean(hashParams.get(SEARCH_PARAM)?.trim());
  const mainTabIds = useMemo(() => getMainTabIds(hasMainDocument), [hasMainDocument]);
  const activeMainTab = useMemo(
    () => resolveMainTabFromUrl(searchParams, hasMainDocument),
    [searchParams, hasMainDocument]
  );
  const sideButtons = useMemo(
    () => buttonsFor(activeMainTab, searchDirty),
    [activeMainTab, buttonsFor, searchDirty]
  );
  return { searchDirty, mainTabIds, activeMainTab, sideButtons };
};

const useResolvedSideTabs = ({ hasMainDocument, ...params }: UseEntityTabsParams) => {
  const searchParams = useEntitySearchParams();
  const hashParams = useEntityHashUiParams();
  const { activeTabId: atomSideTab } = useTabGroup('entity-side');
  const [pendingSideTab, setPendingSideTab] = useAtom(pendingSideTabAtom);
  const { buttonsFor } = useEntitySideButtonModel({ hasMainDocument, ...params });
  const lists = useSideTabLists({ hasMainDocument, searchParams, hashParams, buttonsFor });
  const { explicitSideTab, activeSideTab, syncSideTabId } = useResolvedSideTabIds({
    hashParams,
    sideButtons: lists.sideButtons,
    pendingSideTab,
    atomSideTab,
  });
  return {
    searchParams,
    hashParams,
    pendingSideTab,
    setPendingSideTab,
    buttonsFor,
    ...lists,
    explicitSideTab,
    activeSideTab,
    syncSideTabId,
  };
};

const usePendingSideTabClear = (
  pendingSideTab: SideTabId | null,
  explicitSideTab: SideTabId | undefined,
  clearPendingSideTab: () => void
) => {
  useEffect(() => {
    if (pendingSideTab && explicitSideTab === pendingSideTab) {
      clearPendingSideTab();
    }
  }, [clearPendingSideTab, explicitSideTab, pendingSideTab]);
};

const useSideTabControllers = ({
  entity,
  activeMainTab,
  mainTabIds,
  buttonsFor,
  searchDirty,
  hashParams,
  searchParams,
  pendingSideTab,
  clearPendingSideTab,
  setTabGroups,
  sideButtons,
  hasMainDocument,
  updateEntityUrl,
  setPendingSideTab,
}: {
  entity: UseEntityTabsParams['entity'];
  activeMainTab: ReturnType<typeof resolveMainTabFromUrl>;
  mainTabIds: ReturnType<typeof getMainTabIds>;
  buttonsFor: ReturnType<typeof useEntitySideButtonModel>['buttonsFor'];
  searchDirty: boolean;
  hashParams: URLSearchParams;
  searchParams: URLSearchParams;
  pendingSideTab: SideTabId | null;
  clearPendingSideTab: () => void;
  setTabGroups: (updater: TabGroupsState | ((prev: TabGroupsState) => TabGroupsState)) => void;
  sideButtons: EntitySideTabsState['sideButtons'];
  hasMainDocument: boolean;
  updateEntityUrl: ReturnType<typeof useUpdateEntityUrl>;
  setPendingSideTab: (value: SideTabId | null) => void;
}) => {
  useEntityTabGroupsSync({
    entity,
    activeMainTab,
    mainTabIds,
    buttonsFor,
    searchDirty,
    hashParams,
    searchParams,
    pendingSideTabId: pendingSideTab,
    clearPendingSideTab,
    setTabGroups,
  });
  useEntityTabUrlSanitize({
    hashParams,
    searchParams,
    activeMainTab,
    sideButtons,
    mainTabIds,
    hasMainDocument,
    updateEntityUrl,
  });
  return useCallback(
    (selectedSideTab: string) => {
      if (!isValidSideTab(selectedSideTab)) return;
      setPendingSideTab(selectedSideTab);
      setEntitySideTabInUrl(updateEntityUrl, activeMainTab, selectedSideTab);
    },
    [activeMainTab, setPendingSideTab, updateEntityUrl]
  );
};

const useEntitySideTabs = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
}: UseEntityTabsParams): EntitySideTabsState => {
  const updateEntityUrl = useUpdateEntityUrl();
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const {
    setPendingSideTab,
    pendingSideTab,
    explicitSideTab,
    activeMainTab,
    mainTabIds,
    buttonsFor,
    searchDirty,
    hashParams,
    searchParams,
    sideButtons,
    activeSideTab,
    syncSideTabId,
  } = useResolvedSideTabs({
    entity,
    hasMainDocument,
    mainDocumentId,
    filesSideTabs,
  });
  const clearPendingSideTab = useCallback(() => {
    setPendingSideTab(null);
  }, [setPendingSideTab]);
  usePendingSideTabClear(pendingSideTab, explicitSideTab, clearPendingSideTab);
  const onSideTabChange = useSideTabControllers({
    entity,
    activeMainTab,
    mainTabIds,
    buttonsFor,
    searchDirty,
    hashParams,
    searchParams,
    pendingSideTab,
    clearPendingSideTab,
    setTabGroups,
    sideButtons,
    hasMainDocument,
    updateEntityUrl,
    setPendingSideTab,
  });
  return useMemo(
    () => ({
      activeSideTab,
      syncSideTabId,
      sideButtons,
      onSideTabChange,
    }),
    [activeSideTab, onSideTabChange, sideButtons, syncSideTabId]
  );
};

export { useEntitySideTabs };
