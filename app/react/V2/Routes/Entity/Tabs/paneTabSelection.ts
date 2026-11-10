import { SIDE_TAB, isValidSideTab, type MainTabId, type SideTabId } from './tabIds.js';

type PaneTabAvailability = {
  hasMainDocument: boolean;
  showTranslationsTab: boolean;
  hasEntity: boolean;
};

type PaneTabs = {
  left: SideTabId;
  right: SideTabId;
  leftIds: SideTabId[];
  rightIds: SideTabId[];
  leftChosen: boolean;
  rightChosen: boolean;
};

type PaneChoice = {
  left: boolean;
  right: boolean;
  leftTab: SideTabId;
  rightTab: SideTabId;
};

type ResolvePaneTabsParams = {
  left: string | null;
  rightFromUrl: string | null;
  availability: PaneTabAvailability;
};

type SelectPaneTabParams = {
  current: PaneTabs;
  pane: 'left' | 'right';
  tabId: string;
  availability: PaneTabAvailability;
};

const leftTabIds = (availability: PaneTabAvailability): SideTabId[] => [
  ...(availability.hasMainDocument ? [SIDE_TAB.DOCUMENT] : []),
  ...(availability.hasEntity ? [SIDE_TAB.METADATA] : []),
  SIDE_TAB.RELATIONSHIPS,
  SIDE_TAB.FILES,
  ...(availability.hasMainDocument ? [SIDE_TAB.TOC] : []),
  ...(availability.hasEntity ? [SIDE_TAB.SEARCH] : []),
];

const filesCompanions = (left: SideTabId, availability: PaneTabAvailability): SideTabId[] => {
  if (left !== SIDE_TAB.FILES) return [];
  return [SIDE_TAB.FILE, ...(availability.showTranslationsTab ? [SIDE_TAB.TRANSLATIONS] : [])];
};

const otherThan = (ids: SideTabId[], tabId: SideTabId): SideTabId =>
  ids.find(id => id !== tabId) ?? tabId;

const isFilesCompanion = (tab: string | undefined) =>
  tab === SIDE_TAB.FILE || tab === SIDE_TAB.TRANSLATIONS;

const correlatedTab = (tabId: SideTabId, availability: PaneTabAvailability): SideTabId => {
  if (tabId === SIDE_TAB.DOCUMENT) return SIDE_TAB.METADATA;
  if (tabId === SIDE_TAB.TOC) return SIDE_TAB.DOCUMENT;
  if (tabId === SIDE_TAB.METADATA) {
    return availability.hasMainDocument ? SIDE_TAB.DOCUMENT : SIDE_TAB.SEARCH;
  }
  if (tabId === SIDE_TAB.SEARCH) {
    return availability.hasMainDocument ? SIDE_TAB.DOCUMENT : SIDE_TAB.METADATA;
  }
  if (tabId === SIDE_TAB.FILES) return SIDE_TAB.FILE;
  if (isFilesCompanion(tabId)) return SIDE_TAB.FILES;
  return availability.hasEntity ? SIDE_TAB.METADATA : SIDE_TAB.DOCUMENT;
};

const asLeftTab = (tab: SideTabId | undefined, leftIds: SideTabId[]): SideTabId => {
  if (isFilesCompanion(tab)) return SIDE_TAB.FILES;
  if (tab && leftIds.includes(tab)) return tab;
  return leftIds[0] ?? SIDE_TAB.METADATA;
};

const finishPanes = (
  left: SideTabId | undefined,
  right: SideTabId | undefined,
  availability: PaneTabAvailability
): PaneTabs => {
  const leftIds = leftTabIds(availability);
  const nextLeft = asLeftTab(left, leftIds);
  const rightIds = [...leftIds, ...filesCompanions(nextLeft, availability)];
  const nextRight =
    right && right !== nextLeft && rightIds.includes(right) ? right : otherThan(rightIds, nextLeft);
  return {
    left: nextLeft,
    right: nextRight,
    leftIds,
    rightIds,
    leftChosen: false,
    rightChosen: false,
  };
};

const applyPaneChoice = (resolved: PaneTabs, choice: PaneChoice | null): PaneTabs => {
  if (!choice || choice.leftTab !== resolved.left || choice.rightTab !== resolved.right)
    return resolved;
  return {
    ...resolved,
    leftChosen: resolved.leftChosen && choice.left,
    rightChosen: resolved.rightChosen && choice.right,
  };
};

const resolvePaneTabs = ({ left, rightFromUrl, availability }: ResolvePaneTabsParams): PaneTabs => {
  const rawLeft = isValidSideTab(left) ? left : undefined;
  const rawRight = isValidSideTab(rightFromUrl) ? rightFromUrl : undefined;
  if ([rawLeft, rawRight].some(isFilesCompanion)) {
    const companion = [rawRight, rawLeft].find(isFilesCompanion) ?? SIDE_TAB.FILE;
    return {
      ...finishPanes(SIDE_TAB.FILES, companion, availability),
      leftChosen: Boolean(rawLeft) && !isFilesCompanion(rawLeft),
      rightChosen: true,
    };
  }
  const seededLeft =
    rawLeft ?? (rawRight ? correlatedTab(rawRight, availability) : leftTabIds(availability)[0]);
  return {
    ...finishPanes(seededLeft, rawRight ?? correlatedTab(seededLeft, availability), availability),
    leftChosen: Boolean(rawLeft),
    rightChosen: Boolean(rawRight),
  };
};

const otherSide = ({
  current,
  pane,
  tabId,
  availability,
}: {
  current: PaneTabs;
  pane: 'left' | 'right';
  tabId: SideTabId;
  availability: PaneTabAvailability;
}) => {
  const other = pane === 'left' ? current.right : current.left;
  const chosen = pane === 'left' ? current.rightChosen : current.leftChosen;
  if (chosen && other !== tabId) return { tab: other, chosen: true };
  return { tab: correlatedTab(tabId, availability), chosen: false };
};

const withChoice = ({
  next,
  pane,
  current,
  otherChosen,
}: {
  next: PaneTabs;
  pane: 'left' | 'right';
  current: PaneTabs;
  otherChosen: boolean;
}): PaneTabs => ({
  ...next,
  leftChosen: pane === 'left' ? true : next.left === current.left && otherChosen,
  rightChosen: pane === 'right' ? true : next.right === current.right && otherChosen,
});

const placeSelection = ({
  current,
  pane,
  tabId,
  availability,
}: {
  current: PaneTabs;
  pane: 'left' | 'right';
  tabId: SideTabId;
  availability: PaneTabAvailability;
}): PaneTabs => {
  const other = otherSide({ current, pane, tabId, availability });
  const requestedLeft = pane === 'left' ? tabId : other.tab;
  const requestedRight = pane === 'right' ? tabId : other.tab;
  const next = finishPanes(requestedLeft, requestedRight, availability);
  const otherResult = pane === 'left' ? next.right : next.left;
  const repaired =
    otherResult === (pane === 'left' ? requestedRight : requestedLeft)
      ? next
      : finishPanes(
          pane === 'left' ? next.left : correlatedTab(tabId, availability),
          pane === 'right' ? next.right : correlatedTab(tabId, availability),
          availability
        );
  return withChoice({ next: repaired, pane, current, otherChosen: other.chosen });
};

const searchHitPanes = (
  target: MainTabId,
  searchOnLeft: boolean,
  availability: PaneTabAvailability
): PaneTabs => ({
  ...finishPanes(
    searchOnLeft ? SIDE_TAB.SEARCH : target,
    searchOnLeft ? target : SIDE_TAB.SEARCH,
    availability
  ),
  leftChosen: true,
  rightChosen: true,
});

const selectPaneTab = ({ current, pane, tabId, availability }: SelectPaneTabParams): PaneTabs => {
  const leftIds = leftTabIds(availability);
  const onRightOnly = isFilesCompanion(tabId);
  if (!isValidSideTab(tabId) || (!onRightOnly && !leftIds.includes(tabId))) return current;
  if (onRightOnly) {
    return {
      ...finishPanes(SIDE_TAB.FILES, tabId, availability),
      leftChosen: true,
      rightChosen: true,
    };
  }
  return placeSelection({ current, pane, tabId, availability });
};

export { applyPaneChoice, isFilesCompanion, resolvePaneTabs, searchHitPanes, selectPaneTab };
export type { PaneChoice, PaneTabAvailability, PaneTabs };
