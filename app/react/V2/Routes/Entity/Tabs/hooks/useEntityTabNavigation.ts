import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTabGroup } from '#V2/Components/UI/index.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { MAIN_TAB, SIDE_TAB, isValidMainTab } from '../tabIds.js';

const useEntityTabNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectTab: selectSideTab } = useTabGroup('entity-side');

  const activeMainTab = useMemo(() => {
    const mainTab = searchParams.get(MAIN_TAB_PARAM);
    if (isValidMainTab(mainTab)) return mainTab;
    return MAIN_TAB.METADATA;
  }, [searchParams]);

  const relationshipsOnMain = activeMainTab === MAIN_TAB.RELATIONSHIPS;
  const documentOnMain = activeMainTab === MAIN_TAB.DOCUMENT;

  const focusRelationshipsPanel = useCallback(() => {
    if (relationshipsOnMain) return;
    selectSideTab(SIDE_TAB.RELATIONSHIPS);
    const next = new URLSearchParams(searchParams.toString());
    next.set(SIDE_TAB_PARAM, SIDE_TAB.RELATIONSHIPS);
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [relationshipsOnMain, searchParams, selectSideTab, setSearchParams]);

  const focusDocumentPanel = useCallback(() => {
    if (documentOnMain) return;
    selectSideTab(SIDE_TAB.DOCUMENT);
    const next = new URLSearchParams(searchParams.toString());
    next.set(SIDE_TAB_PARAM, SIDE_TAB.DOCUMENT);
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [documentOnMain, searchParams, selectSideTab, setSearchParams]);

  return {
    activeMainTab,
    relationshipsOnMain,
    documentOnMain,
    focusRelationshipsPanel,
    focusDocumentPanel,
  };
};

export { useEntityTabNavigation };
