/**
 * @jest-environment jsdom
 */

import { getSelectionMenuPosition } from '../getSelectionMenuPosition.js';

describe('getSelectionMenuPosition', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('anchors to the last rectangle on the page, at the clear-button corner', () => {
    const page = document.createElement('div');
    page.id = 'page-3-container';
    document.body.appendChild(page);

    expect(
      getSelectionMenuPosition({
        text: 'one two three',
        selectionRectangles: [
          { left: 10, top: 20, width: 40, height: 12, regionId: '3' },
          { left: 80, top: 200, width: 30, height: 12, regionId: '3' },
        ],
      })
    ).toEqual({ host: page, x: 104, y: 192 });
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
