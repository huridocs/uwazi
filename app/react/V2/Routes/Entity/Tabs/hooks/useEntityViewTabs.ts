import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { useSearchParams } from 'react-router';
import { mergeTabGroup, tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
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
  mainDocumentId?: string;
  searchResults?: SnippetsSearchResponse;
  filesSideTabs: FilesSideTabs;
};

const useEntityViewTabs = ({
  entity,
  hasMainDocument,
  mainDocumentId,
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
        mainDocumentId,
        filesSideTabs,
      }),
    [activeMainTab, entity, hasMainDocument, mainDocumentId, filesSideTabs]
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

  const mainTabParam = searchParams.get(MAIN_TAB_PARAM);
  const sideTabParam = searchParams.get(SIDE_TAB_PARAM);

  // Seed tab atoms from window.location (not mutated useSearchParams — can desync with useBlocker).
  // Re-run when URL search params change (e.g. back/forward) so atoms stay aligned with the address bar.
  useEffect(() => {
    const syncTabsFromLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const mainFromUrl = params.get(MAIN_TAB_PARAM);
      const sideFromUrl = params.get(SIDE_TAB_PARAM);
      const mainId =
        isValidMainTab(mainFromUrl) && mainTabIds.has(mainFromUrl) ? mainFromUrl : activeMainTab;
      const sideButtons = getSideTabButtons({
        activeMainTab: mainId,
        entity,
        hasMainDocument,
        mainDocumentId,
        filesSideTabs,
      });
      const sideId =
        (isValidSideTab(sideFromUrl) && sideButtons.some(button => button.id === sideFromUrl)
          ? sideFromUrl
          : sideButtons[0]?.id) || '';

      setTabGroups(prev => {
        let next = mergeTabGroup(prev, 'entity-main', { activeTabId: mainId });
        if (sideId) {
          next = mergeTabGroup(next, 'entity-side', { activeTabId: sideId });
        }
        return next;
      });
    };

    syncTabsFromLocation();
    window.addEventListener('popstate', syncTabsFromLocation);
    return () => window.removeEventListener('popstate', syncTabsFromLocation);
  }, [
    entity,
    activeMainTab,
    mainTabParam,
    sideTabParam,
    hasMainDocument,
    mainDocumentId,
    filesSideTabs,
    mainTabIds,
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

  const onMainTabChange = useCallback(
    (selectedMainTab: string) => {
      if (!isValidMainTab(selectedMainTab)) return;

      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (selectedMainTab !== activeMainTab) {
            const nextSideButtons = getSideTabButtons({
              activeMainTab: selectedMainTab,
              entity,
              hasMainDocument,
              mainDocumentId,
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
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
    },
    [activeMainTab, setSearchParams, entity, hasMainDocument, mainDocumentId, filesSideTabs]
  );

  const onSideTabChange = useCallback(
    (selectedSideTab: string) => {
      if (!isValidSideTab(selectedSideTab)) return;

      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set(SIDE_TAB_PARAM, selectedSideTab);
          if (!next.get(MAIN_TAB_PARAM)) {
            next.set(MAIN_TAB_PARAM, activeMainTab);
          }
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
    },
    [activeMainTab, setSearchParams]
  );

  return {
    activeMainTab,
    activeSideTab,
    onMainTabChange,
    onSideTabChange,
  };
};

export { useEntityViewTabs };
