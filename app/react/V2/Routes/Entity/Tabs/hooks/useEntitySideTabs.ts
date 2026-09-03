import { useCallback, useEffect, useMemo } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { useTabGroup } from '#V2/Components/UI/index.js';
import {
  useEntityHashUiParams,
  useEntitySearchParams,
  useUpdateEntityUrl,
} from '../../entityUrlState.js';
import { SEARCH_PARAM } from '../../urlParams.js';
import {
  getMainTabIds,
  resolveExplicitSideTab,
  resolveMainTabFromUrl,
  resolveSideTabId,
  setEntitySideTabInUrl,
} from '../entityTabState.js';
import { isValidSideTab } from '../tabIds.js';
import { pendingSideTabAtom } from '../pendingSideTabAtom.js';
import type { EntitySideTabsState, UseEntityTabsParams } from './entityTabsTypes.js';
import { useEntityTabGroupsSync } from './useEntityTabGroupsSync.js';
import { useEntityTabUrlSanitize } from './useEntityTabUrlSanitize.js';
import { useEntitySideButtonModel } from './useEntitySideButtonModel.js';

const useEntitySideTabs = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
}: UseEntityTabsParams): EntitySideTabsState => {
  const searchParams = useEntitySearchParams();
  const hashParams = useEntityHashUiParams();
  const updateEntityUrl = useUpdateEntityUrl();
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const { activeTabId: atomSideTab } = useTabGroup('entity-side');
  const [pendingSideTab, setPendingSideTab] = useAtom(pendingSideTabAtom);
  const { buttonsFor } = useEntitySideButtonModel({
    entity,
    hasMainDocument,
    mainDocumentId,
    filesSideTabs,
  });
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
  const explicitSideTab = useMemo(
    () => resolveExplicitSideTab(hashParams, sideButtons),
    [hashParams, sideButtons]
  );
  const syncSideTabId = pendingSideTab ?? explicitSideTab;
  const activeSideTab = useMemo(() => {
    if (pendingSideTab) return pendingSideTab;
    if (explicitSideTab) return explicitSideTab;
    return resolveSideTabId(
      null,
      sideButtons,
      isValidSideTab(atomSideTab) ? atomSideTab : undefined
    );
  }, [atomSideTab, explicitSideTab, pendingSideTab, sideButtons]);

  const clearPendingSideTab = useCallback(() => {
    setPendingSideTab(null);
  }, [setPendingSideTab]);

  useEffect(() => {
    if (pendingSideTab && explicitSideTab === pendingSideTab) {
      clearPendingSideTab();
    }
  }, [clearPendingSideTab, explicitSideTab, pendingSideTab]);

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

  const onSideTabChange = useCallback(
    (selectedSideTab: string) => {
      if (!isValidSideTab(selectedSideTab)) return;
      setPendingSideTab(selectedSideTab);
      setEntitySideTabInUrl(updateEntityUrl, activeMainTab, selectedSideTab);
    },
    [activeMainTab, setPendingSideTab, updateEntityUrl]
  );

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
