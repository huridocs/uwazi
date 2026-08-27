import type { EntityTabsState } from '../../../../Tabs/hooks/entityTabsTypes.js';
import { MAIN_TAB, SIDE_TAB } from '../../../../Tabs/tabIds.js';

const noop = () => undefined;

const createStubEntityTabsState = (overrides: Partial<EntityTabsState> = {}): EntityTabsState => ({
  activeMainTab: MAIN_TAB.DOCUMENT,
  activeSideTab: SIDE_TAB.RELATIONSHIPS,
  explicitSideTab: SIDE_TAB.RELATIONSHIPS,
  syncSideTabId: SIDE_TAB.RELATIONSHIPS,
  sideButtons: [],
  relationshipsOnMain: false,
  documentOnMain: true,
  onMainTabChange: noop,
  onSideTabChange: noop,
  focusSideTab: noop,
  stageSideTab: noop,
  focusRelationshipsPanel: noop,
  focusDocumentPanel: noop,
  ...overrides,
});

export { createStubEntityTabsState };
