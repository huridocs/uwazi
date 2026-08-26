import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useEntityLanguage } from '../../Components/context/index.js';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import { MAIN_TAB_PARAM } from '../../urlParams.js';
import { setEntitySideTabInUrl } from '../setEntitySideTabInUrl.js';
import { MAIN_TAB, SIDE_TAB, isValidMainTab, type MainTabId } from '../tabIds.js';

const useEntityTabNavigation = () => {
  const [searchParams] = useSearchParams();
  const updateEntityUrl = useUpdateEntityUrl();
  const { mainDocument } = useEntityLanguage();
  const hasMainDocument = Boolean(mainDocument?.filename);

  const activeMainTab = useMemo<MainTabId>(() => {
    const mainTab = searchParams.get(MAIN_TAB_PARAM);
    const mainTabIds = new Set<MainTabId>([
      MAIN_TAB.METADATA,
      MAIN_TAB.RELATIONSHIPS,
      MAIN_TAB.FILES,
    ]);
    if (hasMainDocument) mainTabIds.add(MAIN_TAB.DOCUMENT);
    if (isValidMainTab(mainTab) && mainTabIds.has(mainTab)) return mainTab;
    return hasMainDocument ? MAIN_TAB.DOCUMENT : MAIN_TAB.METADATA;
  }, [hasMainDocument, searchParams]);

  const relationshipsOnMain = activeMainTab === MAIN_TAB.RELATIONSHIPS;
  const documentOnMain = activeMainTab === MAIN_TAB.DOCUMENT;

  const focusRelationshipsPanel = useCallback(() => {
    if (relationshipsOnMain) return;
    setEntitySideTabInUrl(updateEntityUrl, activeMainTab, SIDE_TAB.RELATIONSHIPS);
  }, [activeMainTab, relationshipsOnMain, updateEntityUrl]);

  const focusDocumentPanel = useCallback(() => {
    if (documentOnMain) return;
    setEntitySideTabInUrl(updateEntityUrl, activeMainTab, SIDE_TAB.DOCUMENT);
  }, [activeMainTab, documentOnMain, updateEntityUrl]);

  return {
    activeMainTab,
    relationshipsOnMain,
    documentOnMain,
    focusRelationshipsPanel,
    focusDocumentPanel,
  };
};

export { useEntityTabNavigation };
