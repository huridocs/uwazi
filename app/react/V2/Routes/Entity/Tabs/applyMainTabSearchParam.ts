import { MAIN_TAB_PARAM } from '../urlParams.js';
import { MAIN_TAB, type MainTabId } from './tabIds.js';

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

export { applyMainTabSearchParam };
