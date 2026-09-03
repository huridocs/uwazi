import { useCallback, useMemo } from 'react';
import { useSetAtom } from 'jotai';
import { mergeTabGroup, tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { SEARCH_PARAM } from '../../urlParams.js';
import { useEntitySearchParams, useUpdateEntityUrl } from '../../entityUrlState.js';
import {
  applyMainTabSearchParam,
  pruneSideTabIfInvalidForMain,
  resolveMainTabFromUrl,
  setEntitySideTabInUrl,
} from '../entityTabState.js';
import { MAIN_TAB, SIDE_TAB, isValidMainTab, type SideTabId } from '../tabIds.js';
import { pendingSideTabAtom } from '../pendingSideTabAtom.js';
import type { EntityMainTabsState, UseEntityTabsParams } from './entityTabsTypes.js';
import { useEntitySideButtonModel } from './useEntitySideButtonModel.js';

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
  const relationshipsOnMain = activeMainTab === MAIN_TAB.RELATIONSHIPS;
  const documentOnMain = activeMainTab === MAIN_TAB.DOCUMENT;

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
    },
    [activeMainTab, selectSideTab, setPendingSideTab, updateEntityUrl]
  );

  const focusRelationshipsPanel = useCallback(() => {
    if (relationshipsOnMain) return;
    focusSideTab(SIDE_TAB.RELATIONSHIPS);
  }, [focusSideTab, relationshipsOnMain]);

  const focusDocumentPanel = useCallback(() => {
    if (documentOnMain) return;
    focusSideTab(SIDE_TAB.DOCUMENT);
  }, [documentOnMain, focusSideTab]);

  return useMemo(
    () => ({
      activeMainTab,
      relationshipsOnMain,
      documentOnMain,
      onMainTabChange,
      focusSideTab,
      stageSideTab,
      focusRelationshipsPanel,
      focusDocumentPanel,
    }),
    [
      activeMainTab,
      relationshipsOnMain,
      documentOnMain,
      onMainTabChange,
      focusSideTab,
      stageSideTab,
      focusRelationshipsPanel,
      focusDocumentPanel,
    ]
  );
};

export { useEntityMainTabs };
