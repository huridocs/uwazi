const SELECTION_MENU_PAD = 8;
const SELECTION_MENU_OFFSET_Y = 48;

type Anchor = { x: number; y: number };
type Size = { width: number; height: number };
type Viewport = { width: number; height: number };
type MenuPlacement = { left: number; top: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const placeSelectionMenu = (
  anchor: Anchor,
  size: Size,
  viewport: Viewport,
  pad = SELECTION_MENU_PAD
): MenuPlacement => {
  const width = Math.max(size.width, 0);
  const height = Math.max(size.height, 0);
  const maxLeft = Math.max(pad, viewport.width - pad - width);
  const maxTop = Math.max(pad, viewport.height - pad - height);
  return {
    left: clamp(anchor.x - width / 2, pad, maxLeft),
    top: clamp(anchor.y - SELECTION_MENU_OFFSET_Y, pad, maxTop),
  };
};

export type { Anchor, Size, Viewport, MenuPlacement };
export { placeSelectionMenu, SELECTION_MENU_PAD, SELECTION_MENU_OFFSET_Y };
