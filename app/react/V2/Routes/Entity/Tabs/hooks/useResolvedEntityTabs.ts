import { useMemo, useRef } from 'react';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { SnippetsSearchResponse } from '#V2/api/types.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { getSideTabButtons, type FilesSideTabsOptions } from '../sideTabSets.js';
import { MAIN_TAB, isValidMainTab, type MainTabId } from '../tabIds.js';
import { resolveSideTabId } from './resolveSideTabId.js';

type Params = {
  entity: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  searchResults?: SnippetsSearchResponse;
  filesSideTabs: FilesSideTabsOptions;
  searchParams: URLSearchParams;
};

const useResolvedEntityTabs = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  searchResults,
  filesSideTabs,
  searchParams,
}: Params) => {
  const initialSearchResults = useRef(searchResults);
  const preferSearch = Boolean(initialSearchResults.current);

  const mainTabIds = useMemo(() => {
    const ids = new Set<MainTabId>([MAIN_TAB.METADATA, MAIN_TAB.RELATIONSHIPS, MAIN_TAB.FILES]);
    if (hasMainDocument) ids.add(MAIN_TAB.DOCUMENT);
    return ids;
  }, [hasMainDocument]);

  const activeMainTab = useMemo<MainTabId>(() => {
    const mainTab = searchParams.get(MAIN_TAB_PARAM);
    if (isValidMainTab(mainTab) && mainTabIds.has(mainTab)) return mainTab;
    return hasMainDocument ? MAIN_TAB.DOCUMENT : MAIN_TAB.METADATA;
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

  const activeSideTab = useMemo(
    () => resolveSideTabId(searchParams.get(SIDE_TAB_PARAM), sideTabButtons, preferSearch),
    [searchParams, sideTabButtons, preferSearch]
  );

  return { mainTabIds, activeMainTab, sideTabButtons, activeSideTab, preferSearch };
};

export { useResolvedEntityTabs };
