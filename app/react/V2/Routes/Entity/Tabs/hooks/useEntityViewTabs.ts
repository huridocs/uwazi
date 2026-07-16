import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { useSearchParams } from 'react-router';
import { tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { SnippetsSearchResponse } from '#V2/api/types.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { getSideTabButtons } from '../sideTabSets.js';
import {
  MAIN_TAB,
  SIDE_TAB,
  isValidMainTab,
  isValidSideTab,
  type MainTabId,
  type SideTabId,
} from '../tabIds.js';

type FilesSideTabs = {
  showTranslationsTab: boolean;
  translationsCount: number;
};

type UseEntityViewTabsParams = {
  entity: EntityType;
  hasMainDocument: boolean;
  searchResults?: SnippetsSearchResponse;
  filesSideTabs: FilesSideTabs;
};

const useEntityViewTabs = ({
  entity,
  hasMainDocument,
  searchResults,
  filesSideTabs,
}: UseEntityViewTabsParams) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const initialSearchResults = useRef(searchResults);
  const previousSharedId = useRef(entity.sharedId);

  useEffect(() => {
    if (previousSharedId.current === entity.sharedId) return;
    previousSharedId.current = entity.sharedId;
    setTabGroups(prev => {
      const { 'entity-main': _main, 'entity-side': _side, ...rest } = prev;
      return rest;
    });
  }, [entity.sharedId, setTabGroups]);

  const mainTabIds = useMemo(() => {
    const ids = new Set<MainTabId>([MAIN_TAB.METADATA, MAIN_TAB.RELATIONSHIPS, MAIN_TAB.FILES]);
    if (hasMainDocument) ids.add(MAIN_TAB.DOCUMENT);
    return ids;
  }, [hasMainDocument]);

  const activeMainTab = useMemo<MainTabId>(() => {
    const mainTab = searchParams.get(MAIN_TAB_PARAM);
    if (isValidMainTab(mainTab) && mainTabIds.has(mainTab)) {
      return mainTab;
    }
    if (hasMainDocument) {
      return MAIN_TAB.DOCUMENT;
    }
    return MAIN_TAB.METADATA;
  }, [searchParams, hasMainDocument, mainTabIds]);

  const sideTabButtons = useMemo(
    () =>
      getSideTabButtons({
        activeMainTab,
        entity,
        hasMainDocument,
        filesSideTabs,
      }),
    [activeMainTab, entity, hasMainDocument, filesSideTabs]
  );

  const activeSideTab = useMemo<SideTabId | undefined>(() => {
    const sideTab = searchParams.get(SIDE_TAB_PARAM);

    if (isValidSideTab(sideTab) && sideTabButtons.some(button => button.id === sideTab)) {
      return sideTab;
    }

    if (initialSearchResults.current) {
      return SIDE_TAB.SEARCH;
    }

    const firstId = sideTabButtons[0]?.id;
    if (firstId && isValidSideTab(firstId)) {
      return firstId;
    }
    return undefined;
  }, [searchParams, sideTabButtons]);

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

  const onMainTabChange = useCallback(
    (selectedMainTab: string) => {
      if (!isValidMainTab(selectedMainTab)) return;

      const next = new URLSearchParams(searchParams.toString());
      if (selectedMainTab !== activeMainTab) {
        const nextSideButtons = getSideTabButtons({
          activeMainTab: selectedMainTab,
          entity,
          hasMainDocument,
          filesSideTabs,
        });
        const rawS = next.get(SIDE_TAB_PARAM);
        const sStillValid =
          Boolean(rawS) &&
          isValidSideTab(rawS) &&
          nextSideButtons.some(button => button.id === rawS);
        if (!sStillValid) {
          next.delete(SIDE_TAB_PARAM);
        }
      }
      next.set(MAIN_TAB_PARAM, selectedMainTab);

      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [activeMainTab, searchParams, setSearchParams, entity, hasMainDocument, filesSideTabs]
  );

  const onSideTabChange = useCallback(
    (selectedSideTab: string) => {
      if (!isValidSideTab(selectedSideTab)) return;

      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, selectedSideTab);
      if (!next.get(MAIN_TAB_PARAM)) {
        next.set(MAIN_TAB_PARAM, activeMainTab);
      }
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [activeMainTab, searchParams, setSearchParams]
  );

  return {
    activeMainTab,
    activeSideTab,
    onMainTabChange,
    onSideTabChange,
  };
};

export { useEntityViewTabs };
