import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTabGroup } from '#V2/Components/UI/index.js';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { MAIN_TAB, SIDE_TAB, isValidMainTab } from '../tabIds.js';

const useEntityTabNavigation = () => {
  const [searchParams] = useSearchParams();
  const updateEntityUrl = useUpdateEntityUrl();
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
    updateEntityUrl({
      hash: next => {
        next.set(SIDE_TAB_PARAM, SIDE_TAB.RELATIONSHIPS);
      },
    });
  }, [relationshipsOnMain, selectSideTab, updateEntityUrl]);

  const focusDocumentPanel = useCallback(() => {
    if (documentOnMain) return;
    selectSideTab(SIDE_TAB.DOCUMENT);
    updateEntityUrl({
      hash: next => {
        next.set(SIDE_TAB_PARAM, SIDE_TAB.DOCUMENT);
      },
    });
  }, [documentOnMain, selectSideTab, updateEntityUrl]);

  return {
    activeMainTab,
    relationshipsOnMain,
    documentOnMain,
    focusRelationshipsPanel,
    focusDocumentPanel,
  };
};

export { useEntityTabNavigation };
