import { useCallback, useMemo } from 'react';
import { useTabGroup } from '#V2/Components/UI/index.js';
import { useUpdateEntityUrl } from '#V2/Routes/Entity/entityUrlState.js';
import type { EntityTabsState } from '#V2/Routes/Entity/Tabs/EntityTabsContext.js';
import { MAIN_TAB, type MainTabId, type SideTabId } from '#V2/Routes/Entity/Tabs/tabIds.js';

const noop = () => undefined;

const useLibraryPreviewTabs = (mainTabId: SideTabId): EntityTabsState => {
  const { selectTab } = useTabGroup('entity-main');
  const updateEntityUrl = useUpdateEntityUrl();
  const openSearchHit = useCallback(
    (mainTab: MainTabId, options?: { hash?: (params: URLSearchParams) => void }) => {
      selectTab(mainTab);
      if (options?.hash) updateEntityUrl({ hash: options.hash });
    },
    [selectTab, updateEntityUrl]
  );

  return useMemo(
    (): EntityTabsState => ({
      activeMainTab: mainTabId,
      mainButtons: [],
      activeSideTab: undefined,
      syncSideTabId: undefined,
      sideButtons: [],
      relationshipsOnMain: mainTabId === MAIN_TAB.RELATIONSHIPS,
      documentOnMain: mainTabId === MAIN_TAB.DOCUMENT,
      onMainTabChange: selectTab,
      onSideTabChange: noop,
      focusSideTab: selectTab,
      stageSideTab: selectTab,
      focusRelationshipsPanel: () => selectTab(MAIN_TAB.RELATIONSHIPS),
      focusDocumentPanel: () => selectTab(MAIN_TAB.DOCUMENT),
      showSidePane: noop,
      openSearchHit,
    }),
    [mainTabId, openSearchHit, selectTab]
  );
};

export { useLibraryPreviewTabs };
