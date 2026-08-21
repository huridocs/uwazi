import { MAIN_TAB, SIDE_TAB, type MainTabId, type SideTabId } from './tabIds.js';

const documentRelationshipRailVisible = (mainTab: MainTabId, sideTab?: SideTabId) =>
  mainTab === MAIN_TAB.DOCUMENT || (sideTab === SIDE_TAB.DOCUMENT && mainTab !== MAIN_TAB.METADATA);

export { documentRelationshipRailVisible };
