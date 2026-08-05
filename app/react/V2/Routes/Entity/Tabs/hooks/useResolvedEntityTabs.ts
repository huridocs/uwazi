import { useMemo } from 'react';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { getSideTabButtons, type FilesSideTabsOptions } from '../sideTabSets.js';
import { MAIN_TAB, isValidMainTab, type MainTabId } from '../tabIds.js';
import { resolveSideTabId } from './resolveSideTabId.js';

type Params = {
  entity: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  filesSideTabs: FilesSideTabsOptions;
  searchParams: URLSearchParams;
  hashParams: URLSearchParams;
};

const useResolvedEntityTabs = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
  searchParams,
  hashParams,
}: Params) => {
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
    () => resolveSideTabId(hashParams.get(SIDE_TAB_PARAM), sideTabButtons),
    [hashParams, sideTabButtons]
  );

  return { mainTabIds, activeMainTab, sideTabButtons, activeSideTab };
};

export { useResolvedEntityTabs };
