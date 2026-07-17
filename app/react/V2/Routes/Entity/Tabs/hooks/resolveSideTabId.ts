import { SIDE_TAB, isValidSideTab, type SideTabId } from '../tabIds.js';

type SideTabButton = { id: string };

const resolveSideTabId = (
  sideFromUrl: string | null,
  sideButtons: SideTabButton[],
  preferSearch: boolean
): SideTabId | undefined => {
  if (isValidSideTab(sideFromUrl) && sideButtons.some(button => button.id === sideFromUrl)) {
    return sideFromUrl;
  }
  if (preferSearch && sideButtons.some(button => button.id === SIDE_TAB.SEARCH)) {
    return SIDE_TAB.SEARCH;
  }
  const firstId = sideButtons[0]?.id;
  return firstId && isValidSideTab(firstId) ? firstId : undefined;
};

export { resolveSideTabId };
export type { SideTabButton };
