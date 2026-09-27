/**
 * @jest-environment jsdom
 */

import { getSelectionMenuPosition } from '../getSelectionMenuPosition.js';

describe('getSelectionMenuPosition', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('anchors to the last rectangle, at the clear-button corner', () => {
    const page = document.createElement('div');
    page.id = 'page-3-container';
    document.body.appendChild(page);
    jest.spyOn(page, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      width: 400,
      height: 800,
      right: 500,
      bottom: 850,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    } as DOMRect);

    expect(
      getSelectionMenuPosition({
        text: 'one two three',
        selectionRectangles: [
          { left: 10, top: 20, width: 40, height: 12, regionId: '3' },
          { left: 80, top: 200, width: 30, height: 12, regionId: '3' },
        ],
      })
    ).toEqual({ x: 210, y: 250 });
  });

  it('returns undefined when the page container is missing', () => {
    expect(
      getSelectionMenuPosition({
        text: 'one',
        selectionRectangles: [{ left: 10, top: 20, width: 40, height: 12, regionId: '1' }],
      })
    ).toBeUndefined();
  });
});
