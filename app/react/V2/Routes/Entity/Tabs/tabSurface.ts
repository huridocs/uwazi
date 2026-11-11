import { MAIN_TAB, type SideTabId } from './tabIds.js';

const MAIN_TAB_PAPER_PADDING = 'px-4 py-3 pb-8';

const mainTabPanelSurfaceClass = (activeTabId: SideTabId, metadataActive: boolean) =>
  metadataActive || activeTabId === MAIN_TAB.RELATIONSHIPS ? 'bg-paper' : 'bg-warm';

export { MAIN_TAB_PAPER_PADDING, mainTabPanelSurfaceClass };
