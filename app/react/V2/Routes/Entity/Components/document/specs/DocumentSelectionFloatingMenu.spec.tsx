/**
 * @jest-environment jsdom
 */
import { placeSelectionMenu, SELECTION_MENU_PAD } from '../placeSelectionMenu.js';

const viewport = { width: 800, height: 600 };
const size = { width: 300, height: 40 };

describe('placeSelectionMenu', () => {
  it('centers on the anchor when the menu fits', () => {
    expect(placeSelectionMenu({ x: 400, y: 200 }, size, viewport)).toEqual({
      left: 250,
      top: 152,
    });
  });

  it('clamps left near the viewport right', () => {
    expect(placeSelectionMenu({ x: 790, y: 200 }, size, viewport).left).toBe(
      viewport.width - SELECTION_MENU_PAD - size.width
    );
  });

  it('clamps left near the viewport left', () => {
    expect(placeSelectionMenu({ x: 10, y: 200 }, size, viewport).left).toBe(SELECTION_MENU_PAD);
  });

  it('clamps top near the viewport top', () => {
    expect(placeSelectionMenu({ x: 400, y: 20 }, size, viewport).top).toBe(SELECTION_MENU_PAD);
  });

  it('clamps top near the viewport bottom', () => {
    expect(placeSelectionMenu({ x: 400, y: 610 }, size, viewport).top).toBe(
      viewport.height - SELECTION_MENU_PAD - size.height
    );
  });
});
