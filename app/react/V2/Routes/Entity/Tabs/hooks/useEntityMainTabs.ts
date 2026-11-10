import { useCallback, useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import { mergeTabGroup, tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { pendingSideTabAtom } from '../entityTabState.js';
import { MAIN_TAB, SIDE_TAB, type MainTabId, type SideTabId } from '../tabIds.js';
import type { EntityMainTabsState, UseEntityTabsParams } from '../EntityTabsContext.js';
import { useEntityPaneTabs } from './useEntityPaneTabs.js';

const usePaneRequest = (): [{ index: number; id: number } | undefined, (index: number) => void] => {
  const [requestedPane, setRequestedPane] = useState<{ index: number; id: number } | undefined>();
  const requestPane = useCallback((index: number) => {
    setRequestedPane(current => ({ index, id: (current?.id ?? 0) + 1 }));
  }, []);
  return [requestedPane, requestPane];
};

const openSubjectPane = ({
  left,
  subject,
  requestPane,
  focusSideTab,
}: {
  left: ReturnType<typeof useEntityPaneTabs>['panes']['left'];
  subject: ReturnType<typeof useEntityPaneTabs>['panes']['left'];
  requestPane: (index: number) => void;
  focusSideTab: (sideTab: SideTabId) => void;
}) => {
  if (left === subject) {
    requestPane(0);
    return;
  }
  focusSideTab(subject);
};

const useMainPaneActions = (
  pane: ReturnType<typeof useEntityPaneTabs>,
  requestPane: (index: number) => void
) => {
  const setPendingSideTab = useSetAtom(pendingSideTabAtom);
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const onMainTabChange = useCallback(
    (selectedMainTab: string) => {
      pane.commit('left', selectedMainTab);
    },
    [pane]
  );
  const stageSideTab = useCallback(
    (sideTab: SideTabId) => {
      setPendingSideTab(sideTab);
      setTabGroups(prev => mergeTabGroup(prev, 'entity-side', { activeTabId: sideTab }));
    },
    [setPendingSideTab, setTabGroups]
  );
  const focusSideTab = useCallback(
    (sideTab: SideTabId) => {
      pane.commit('right', sideTab);
      requestPane(1);
    },
    [pane, requestPane]
  );
  const focusRelationshipsPanel = useCallback(() => {
    openSubjectPane({
      left: pane.panes.left,
      subject: MAIN_TAB.RELATIONSHIPS,
      requestPane,
      focusSideTab,
    });
  }, [focusSideTab, pane.panes.left, requestPane]);
  const focusDocumentPanel = useCallback(() => {
    openSubjectPane({
      left: pane.panes.left,
      subject: MAIN_TAB.DOCUMENT,
      requestPane,
      focusSideTab,
    });
  }, [focusSideTab, pane.panes.left, requestPane]);
  const showSidePane = useCallback(() => {
    requestPane(1);
  }, [requestPane]);
  const openSearchHit = useCallback(
    (mainTab: MainTabId, options?: { hash?: (params: URLSearchParams) => void }) => {
      if (pane.panes.left === SIDE_TAB.SEARCH) requestPane(1);
      pane.openSearchHit(mainTab, options);
    },
    [pane, requestPane]
  );
  return {
    onMainTabChange,
    stageSideTab,
    focusSideTab,
    focusRelationshipsPanel,
    focusDocumentPanel,
    showSidePane,
    openSearchHit,
  };
};

const useEntityMainTabs = (params: UseEntityTabsParams): EntityMainTabsState => {
  const pane = useEntityPaneTabs(params);
  const [requestedPane, requestPane] = usePaneRequest();
  const actions = useMainPaneActions(pane, requestPane);

  return useMemo(
    () => ({
      activeMainTab: pane.panes.left,
      mainButtons: pane.leftButtons,
      relationshipsOnMain: pane.panes.left === MAIN_TAB.RELATIONSHIPS,
      documentOnMain: pane.panes.left === MAIN_TAB.DOCUMENT,
      ...actions,
      requestedPane,
    }),
    [actions, pane.leftButtons, pane.panes.left, requestedPane]
  );
};

export { useEntityMainTabs };
