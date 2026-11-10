import { SIDE_TAB, type SideTabId } from './tabIds.js';

const documentRelationshipRailVisible = (leftTab: SideTabId, sideTab?: SideTabId) =>
  leftTab === SIDE_TAB.DOCUMENT || (sideTab === SIDE_TAB.DOCUMENT && leftTab !== SIDE_TAB.METADATA);

export { documentRelationshipRailVisible };
