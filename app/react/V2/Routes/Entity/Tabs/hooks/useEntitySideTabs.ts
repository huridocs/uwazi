import { useCallback, useMemo } from 'react';
import { useSetAtom } from 'jotai';
import { tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import type { UseEntityTabsParams } from '../EntityTabsContext.js';
import { getMainTabIds } from '../entityTabState.js';
import { useEntityPaneTabs } from './useEntityPaneTabs.js';
import { useEntityTabGroupsSync } from './useEntityTabGroupsSync.js';
import { useEntityTabUrlSanitize } from './useEntityTabUrlSanitize.js';

const useEntitySideTabs = (params: UseEntityTabsParams) => {
  const pane = useEntityPaneTabs(params);
  const updateEntityUrl = useUpdateEntityUrl();
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const mainTabIds = useMemo(() => getMainTabIds(params.hasMainDocument), [params.hasMainDocument]);
  const clearPendingSideTab = useCallback(() => {
    pane.setPendingSide(null);
  }, [pane]);
  useEntityTabGroupsSync({
    entity: params.entity,
    activeMainTab: pane.panes.left,
    activeSideTab: pane.panes.right,
    pendingLeftTab: pane.pendingLeft,
    clearPendingSideTab,
    setTabGroups,
  });
  useEntityTabUrlSanitize({
    hashParams: pane.hashParams,
    searchParams: pane.searchParams,
    activeMainTab: pane.panes.left,
    sideButtons: pane.rightButtons,
    mainTabIds,
    hasMainDocument: params.hasMainDocument,
    suspend: Boolean(pane.pendingSide || pane.pendingLeft),
    updateEntityUrl,
  });
  const onSideTabChange = useCallback(
    (selectedSideTab: string) => {
      pane.commit('right', selectedSideTab);
    },
    [pane]
  );

  return useMemo(
    () => ({
      activeSideTab: pane.panes.right,
      syncSideTabId: pane.panes.right,
      sideButtons: pane.rightButtons,
      onSideTabChange,
    }),
    [onSideTabChange, pane.panes.right, pane.rightButtons]
  );
};

export { useEntitySideTabs };
