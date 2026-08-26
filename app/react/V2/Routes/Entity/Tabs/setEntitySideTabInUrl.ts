import type { UpdateEntityUrlOptions } from '../entityUrlState.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../urlParams.js';
import { MAIN_TAB, type MainTabId, type SideTabId } from './tabIds.js';

type UpdateEntityUrl = (options: UpdateEntityUrlOptions) => void;

const setEntitySideTabInUrl = (
  updateEntityUrl: UpdateEntityUrl,
  activeMainTab: MainTabId,
  selectedSideTab: SideTabId
) => {
  updateEntityUrl({
    search: next => {
      if (!next.get(MAIN_TAB_PARAM) && activeMainTab !== MAIN_TAB.DOCUMENT) {
        next.set(MAIN_TAB_PARAM, activeMainTab);
      }
    },
    hash: next => {
      next.set(SIDE_TAB_PARAM, selectedSideTab);
    },
  });
};

export { setEntitySideTabInUrl };
