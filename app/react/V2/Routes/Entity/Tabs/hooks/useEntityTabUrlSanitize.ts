import { useEffect } from 'react';
import type { UpdateEntityUrlOptions } from '../../entityUrlState.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import type { TabButtonDef } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { MAIN_TAB, isValidMainTab, isValidSideTab, type MainTabId } from '../tabIds.js';

type UseEntityTabUrlSanitizeParams = {
  hashParams: URLSearchParams;
  searchParams: URLSearchParams;
  activeMainTab: MainTabId;
  sideButtons: TabButtonDef[];
  mainTabIds: Set<MainTabId>;
  hasMainDocument: boolean;
  updateEntityUrl: (options: UpdateEntityUrlOptions) => void;
};

const useEntityTabUrlSanitize = ({
  hashParams,
  searchParams,
  activeMainTab,
  sideButtons,
  mainTabIds,
  hasMainDocument,
  updateEntityUrl,
}: UseEntityTabUrlSanitizeParams) => {
  useEffect(() => {
    const raw = hashParams.get(SIDE_TAB_PARAM);
    if (!raw || !isValidSideTab(raw)) return;
    if (sideButtons.some(button => button.id === raw)) return;
    updateEntityUrl({
      hash: next => {
        next.delete(SIDE_TAB_PARAM);
      },
    });
  }, [hashParams, activeMainTab, sideButtons, updateEntityUrl]);

  useEffect(() => {
    const raw = searchParams.get(MAIN_TAB_PARAM);
    if (!raw || !isValidMainTab(raw)) return;
    if (raw === MAIN_TAB.DOCUMENT && hasMainDocument) {
      updateEntityUrl({
        search: next => {
          next.delete(MAIN_TAB_PARAM);
        },
      });
      return;
    }
    if (mainTabIds.has(raw)) return;
    updateEntityUrl({
      search: next => {
        next.delete(MAIN_TAB_PARAM);
      },
    });
  }, [searchParams, mainTabIds, hasMainDocument, updateEntityUrl]);
};

export { useEntityTabUrlSanitize };
