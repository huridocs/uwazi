import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useSearchParams } from 'react-router';
import { tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { useTabGroup } from '#V2/Components/UI/index.js';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { countEntityFiles, countEntityRelationships } from '#V2/formatters/index.js';
import { useDirectedRelationships, useMetadataEditing } from '../../Components/context/index.js';
import { useEntityHashParams, useUpdateEntityUrl } from '../../entityUrlState.js';
import { SEARCH_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import {
  applyMainTabSearchParam,
  getMainTabIds,
  resolveExplicitSideTab,
  resolveMainTabFromUrl,
  resolveSideTabId,
  setEntitySideTabInUrl,
} from '../entityTabState.js';
import { getSideTabButtons } from '../sideTabSets.js';
import { MAIN_TAB, SIDE_TAB, isValidMainTab, isValidSideTab, type SideTabId } from '../tabIds.js';
import type { EntityTabsState, UseEntityTabsParams } from './entityTabsTypes.js';
import { useEntityTabGroupsSync } from './useEntityTabGroupsSync.js';
import { useEntityTabUrlSanitize } from './useEntityTabUrlSanitize.js';

const useEntityTabs = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
}: UseEntityTabsParams): EntityTabsState => {
  const [searchParams] = useSearchParams();
  const hashParams = useEntityHashParams();
  const updateEntityUrl = useUpdateEntityUrl();
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const { selectTab: selectSideTab, activeTabId: atomSideTab } = useTabGroup('entity-side');
  const relationships = useDirectedRelationships();
  const { isDirty: metadataDirty } = useMetadataEditing();
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const pendingSideTabRef = useRef<SideTabId | null>(null);
  const [pendingSideTab, setPendingSideTab] = useState<SideTabId | null>(null);

  const relationshipsCount = countEntityRelationships(
    entity.sharedId,
    relationships,
    mainDocumentId
  );
  const filesCount = useMemo(
    () => countEntityFiles(entity, templates, locale, defaultLanguage),
    [defaultLanguage, entity, locale, templates]
  );
  const searchDirty = Boolean(hashParams.get(SEARCH_PARAM)?.trim());

  const mainTabIds = useMemo(() => getMainTabIds(hasMainDocument), [hasMainDocument]);
  const activeMainTab = useMemo(
    () => resolveMainTabFromUrl(searchParams, hasMainDocument),
    [searchParams, hasMainDocument]
  );

  const sideButtons = useMemo(
    () =>
      getSideTabButtons({
        activeMainTab,
        entity,
        hasMainDocument,
        mainDocumentId,
        filesSideTabs,
        metadataDirty,
        searchDirty,
        filesCount,
        relationshipsCount,
      }),
    [
      activeMainTab,
      entity,
      filesCount,
      filesSideTabs,
      hasMainDocument,
      mainDocumentId,
      metadataDirty,
      relationshipsCount,
      searchDirty,
    ]
  );

  const explicitSideTab = useMemo(
    () => resolveExplicitSideTab(hashParams, sideButtons),
    [hashParams, sideButtons]
  );

  const relationshipsOnMain = activeMainTab === MAIN_TAB.RELATIONSHIPS;
  const documentOnMain = activeMainTab === MAIN_TAB.DOCUMENT;
  const pendingSideTabId = pendingSideTabRef.current ?? pendingSideTab;
  const syncSideTabId = pendingSideTabId ?? explicitSideTab;
  const activeSideTabResolved = useMemo(() => {
    if (pendingSideTabId) return pendingSideTabId;
    if (explicitSideTab) return explicitSideTab;
    return resolveSideTabId(
      null,
      sideButtons,
      isValidSideTab(atomSideTab) ? atomSideTab : undefined
    );
  }, [atomSideTab, explicitSideTab, pendingSideTabId, sideButtons]);

  const clearPendingSideTab = useCallback(() => {
    pendingSideTabRef.current = null;
    setPendingSideTab(null);
  }, []);

  useEffect(() => {
    if (pendingSideTabId && explicitSideTab === pendingSideTabId) {
      clearPendingSideTab();
    }
  }, [clearPendingSideTab, explicitSideTab, pendingSideTabId]);

  useEntityTabGroupsSync({
    entity,
    activeMainTab,
    mainTabIds,
    hasMainDocument,
    mainDocumentId,
    filesSideTabs,
    metadataDirty,
    searchDirty,
    filesCount,
    relationshipsCount,
    hashParams,
    searchParams,
    pendingSideTabId,
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

  const onMainTabChange = useCallback(
    (selectedMainTab: string) => {
      if (!isValidMainTab(selectedMainTab)) return;
      updateEntityUrl({
        search: next => applyMainTabSearchParam(next, selectedMainTab, hasMainDocument),
        hash: next => {
          if (selectedMainTab === activeMainTab) return;
          const nextSideButtons = getSideTabButtons({
            activeMainTab: selectedMainTab,
            entity,
            hasMainDocument,
            mainDocumentId,
            filesSideTabs,
            metadataDirty,
            searchDirty,
            filesCount,
            relationshipsCount,
          });
          const rawS = hashParams.get(SIDE_TAB_PARAM);
          const sStillValid =
            Boolean(rawS) &&
            isValidSideTab(rawS) &&
            nextSideButtons.some(button => button.id === rawS);
          if (!sStillValid) {
            next.delete(SIDE_TAB_PARAM);
          }
        },
      });
    },
    [
      activeMainTab,
      entity,
      filesCount,
      filesSideTabs,
      hashParams,
      hasMainDocument,
      mainDocumentId,
      metadataDirty,
      relationshipsCount,
      searchDirty,
      updateEntityUrl,
    ]
  );

  const stageSideTab = useCallback(
    (sideTab: SideTabId) => {
      pendingSideTabRef.current = sideTab;
      setPendingSideTab(sideTab);
      selectSideTab(sideTab);
    },
    [selectSideTab]
  );

  const navigateSideTab = useCallback(
    (sideTab: SideTabId, syncAtom = true) => {
      pendingSideTabRef.current = sideTab;
      setPendingSideTab(sideTab);
      if (syncAtom) selectSideTab(sideTab);
      setEntitySideTabInUrl(updateEntityUrl, activeMainTab, sideTab);
    },
    [activeMainTab, selectSideTab, updateEntityUrl]
  );

  const onSideTabChange = useCallback(
    (selectedSideTab: string) => {
      if (!isValidSideTab(selectedSideTab)) return;
      navigateSideTab(selectedSideTab, false);
    },
    [navigateSideTab]
  );

  const focusSideTab = useCallback(
    (sideTab: SideTabId) => {
      navigateSideTab(sideTab);
    },
    [navigateSideTab]
  );

  const focusRelationshipsPanel = useCallback(() => {
    if (relationshipsOnMain) return;
    focusSideTab(SIDE_TAB.RELATIONSHIPS);
  }, [focusSideTab, relationshipsOnMain]);

  const focusDocumentPanel = useCallback(() => {
    if (documentOnMain) return;
    focusSideTab(SIDE_TAB.DOCUMENT);
  }, [documentOnMain, focusSideTab]);

  return {
    activeMainTab,
    activeSideTab: activeSideTabResolved,
    explicitSideTab,
    syncSideTabId,
    sideButtons,
    relationshipsOnMain,
    documentOnMain,
    onMainTabChange,
    onSideTabChange,
    focusSideTab,
    stageSideTab,
    focusRelationshipsPanel,
    focusDocumentPanel,
  };
};

export { useEntityTabs };
export type { EntityTabsState, UseEntityTabsParams } from './entityTabsTypes.js';
