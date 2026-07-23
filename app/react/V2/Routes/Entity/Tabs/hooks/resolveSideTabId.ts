import { isValidSideTab, type SideTabId } from '../tabIds.js';

type SideTabButton = { id: string };

const resolveSideTabId = (
  sideFromUrl: string | null,
  sideButtons: SideTabButton[]
): SideTabId | undefined => {
  if (isValidSideTab(sideFromUrl) && sideButtons.some(button => button.id === sideFromUrl)) {
    return sideFromUrl;
  }
  const firstId = sideButtons[0]?.id;
  return firstId && isValidSideTab(firstId) ? firstId : undefined;
};

export { resolveSideTabId };
export type { SideTabButton };
