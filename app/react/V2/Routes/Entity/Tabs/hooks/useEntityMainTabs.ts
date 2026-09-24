import { useCallback, useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  mergeTabGroup,
  tabGroupsAtom,
  type TabGroupsState,
} from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { SEARCH_PARAM } from '../../urlParams.js';
import { useEntitySearchParams, useUpdateEntityUrl } from '../../entityUrlState.js';
import type { EntityMainTabsState, UseEntityTabsParams } from '../EntityTabsContext.js';
import {
  applyMainTabSearchParam,
  pendingSideTabAtom,
  pruneSideTabIfInvalidForMain,
  resolveMainTabFromUrl,
  setEntitySideTabInUrl,
} from '../entityTabState.js';
import { MAIN_TAB, SIDE_TAB, isValidMainTab, type MainTabId, type SideTabId } from '../tabIds.js';
import { useEntitySideButtonModel } from './useEntitySideButtonModel.js';

const usePaneRequest = (): [{ index: number; id: number } | undefined, (index: number) => void] => {
  const [requestedPane, setRequestedPane] = useState<{ index: number; id: number } | undefined>();
  const requestPane = useCallback((index: number) => {
    setRequestedPane(current => ({ index, id: (current?.id ?? 0) + 1 }));
  }, []);
  return [requestedPane, requestPane];
};

const useMainTabActions = ({
  activeMainTab,
  buttonsFor,
  documentOnMain,
  hasMainDocument,
  relationshipsOnMain,
  requestPane,
  setPendingSideTab,
  setTabGroups,
  updateEntityUrl,
}: {
  activeMainTab: MainTabId;
  buttonsFor: ReturnType<typeof useEntitySideButtonModel>['buttonsFor'];
  documentOnMain: boolean;
  hasMainDocument: boolean;
  relationshipsOnMain: boolean;
  requestPane: (index: number) => void;
  setPendingSideTab: (value: SideTabId | null) => void;
  setTabGroups: (updater: TabGroupsState | ((prev: TabGroupsState) => TabGroupsState)) => void;
  updateEntityUrl: ReturnType<typeof useUpdateEntityUrl>;
}) => {
  const selectSideTab = useCallback(
    (sideTab: SideTabId) => {
      setTabGroups(prev => mergeTabGroup(prev, 'entity-side', { activeTabId: sideTab }));
    },
    [setTabGroups]
  );

  const onMainTabChange = useCallback(
    (selectedMainTab: string) => {
      if (!isValidMainTab(selectedMainTab)) return;
      updateEntityUrl({
        search: next => applyMainTabSearchParam(next, selectedMainTab, hasMainDocument),
        hash: next => {
          const searchDirty = Boolean(next.get(SEARCH_PARAM)?.trim());
          const available = buttonsFor(selectedMainTab, searchDirty);
          pruneSideTabIfInvalidForMain({
            hash: next,
            selectedMainTab,
            activeMainTab,
            isSideTabAvailable: sideTab => available.some(button => button.id === sideTab),
          });
        },
      });
    },
    [activeMainTab, buttonsFor, hasMainDocument, updateEntityUrl]
  );

  const stageSideTab = useCallback(
    (sideTab: SideTabId) => {
      setPendingSideTab(sideTab);
      selectSideTab(sideTab);
    },
    [selectSideTab, setPendingSideTab]
  );

  const focusSideTab = useCallback(
    (sideTab: SideTabId) => {
      setPendingSideTab(sideTab);
      selectSideTab(sideTab);
      setEntitySideTabInUrl(updateEntityUrl, activeMainTab, sideTab);
      requestPane(1);
    },
    [activeMainTab, requestPane, selectSideTab, setPendingSideTab, updateEntityUrl]
  );

  const focusRelationshipsPanel = useCallback(() => {
    if (relationshipsOnMain) {
      requestPane(0);
      return;
    }
    focusSideTab(SIDE_TAB.RELATIONSHIPS);
  }, [focusSideTab, relationshipsOnMain, requestPane]);

  const focusDocumentPanel = useCallback(() => {
    if (documentOnMain) {
      requestPane(0);
      return;
    }
    focusSideTab(SIDE_TAB.DOCUMENT);
  }, [documentOnMain, focusSideTab, requestPane]);

  return useMemo(
    () => ({
      onMainTabChange,
      focusSideTab,
      stageSideTab,
      focusRelationshipsPanel,
      focusDocumentPanel,
    }),
    [focusDocumentPanel, focusRelationshipsPanel, focusSideTab, onMainTabChange, stageSideTab]
  );
};

const useEntityMainTabs = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
}: UseEntityTabsParams): EntityMainTabsState => {
  const searchParams = useEntitySearchParams();
  const updateEntityUrl = useUpdateEntityUrl();
  const setPendingSideTab = useSetAtom(pendingSideTabAtom);
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const { buttonsFor } = useEntitySideButtonModel({
    entity,
    hasMainDocument,
    mainDocumentId,
    filesSideTabs,
  });
  const activeMainTab = useMemo(
    () => resolveMainTabFromUrl(searchParams, hasMainDocument),
    [searchParams, hasMainDocument]
  );
  const onMain = {
    relationships: activeMainTab === MAIN_TAB.RELATIONSHIPS,
    document: activeMainTab === MAIN_TAB.DOCUMENT,
  };
  const [requestedPane, requestPane] = usePaneRequest();
  const actions = useMainTabActions({
    activeMainTab,
    buttonsFor,
    documentOnMain: onMain.document,
    hasMainDocument,
    relationshipsOnMain: onMain.relationships,
    requestPane,
    setPendingSideTab,
    setTabGroups,
    updateEntityUrl,
  });
  return useMemo(
    () => ({
      activeMainTab,
      relationshipsOnMain: onMain.relationships,
      documentOnMain: onMain.document,
      requestedPane,
      ...actions,
    }),
    [actions, activeMainTab, onMain.document, onMain.relationships, requestedPane]
  );
};

export { useEntityMainTabs };
