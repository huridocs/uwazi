import type { UpdateEntityUrlOptions } from '../entityUrlState.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../urlParams.js';
import {
  MAIN_TAB,
  isValidMainTab,
  isValidSideTab,
  type MainTabId,
  type SideTabId,
} from './tabIds.js';

type SideTabButton = { id: string };
type UpdateEntityUrl = (options: UpdateEntityUrlOptions) => void;

const getMainTabIds = (hasMainDocument: boolean): Set<MainTabId> => {
  const ids = new Set<MainTabId>([MAIN_TAB.METADATA, MAIN_TAB.RELATIONSHIPS, MAIN_TAB.FILES]);
  if (hasMainDocument) ids.add(MAIN_TAB.DOCUMENT);
  return ids;
};

const resolveMainTabFromUrl = (
  searchParams: URLSearchParams,
  hasMainDocument: boolean
): MainTabId => {
  const mainTabIds = getMainTabIds(hasMainDocument);
  const mainTab = searchParams.get(MAIN_TAB_PARAM);
  if (isValidMainTab(mainTab) && mainTabIds.has(mainTab)) return mainTab;
  return hasMainDocument ? MAIN_TAB.DOCUMENT : MAIN_TAB.METADATA;
};

const resolveSideTabId = (
  sideFromUrl: string | null,
  sideButtons: SideTabButton[],
  currentSideTab?: string | null
): SideTabId | undefined => {
  if (isValidSideTab(sideFromUrl) && sideButtons.some(button => button.id === sideFromUrl)) {
    return sideFromUrl;
  }
  if (
    currentSideTab &&
    isValidSideTab(currentSideTab) &&
    sideButtons.some(button => button.id === currentSideTab)
  ) {
    return currentSideTab;
  }
  const firstId = sideButtons[0]?.id;
  return firstId && isValidSideTab(firstId) ? firstId : undefined;
};

const resolveExplicitSideTab = (
  hashParams: URLSearchParams,
  sideButtons: SideTabButton[]
): SideTabId | undefined => {
  const sideTabFromHash = hashParams.get(SIDE_TAB_PARAM);
  if (!isValidSideTab(sideTabFromHash)) return undefined;
  return sideButtons.some(button => button.id === sideTabFromHash) ? sideTabFromHash : undefined;
};

const applyMainTabSearchParam = (
  params: URLSearchParams,
  mainTab: MainTabId,
  hasMainDocument: boolean
) => {
  if (mainTab === MAIN_TAB.DOCUMENT && hasMainDocument) {
    params.delete(MAIN_TAB_PARAM);
  } else {
    params.set(MAIN_TAB_PARAM, mainTab);
  }
};

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

export {
  applyMainTabSearchParam,
  getMainTabIds,
  resolveExplicitSideTab,
  resolveMainTabFromUrl,
  resolveSideTabId,
  setEntitySideTabInUrl,
};
export type { SideTabButton, UpdateEntityUrl };
