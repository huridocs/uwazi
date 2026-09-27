/**
 * @jest-environment jsdom
 */

import { collectPdfWords, selectionFromWordRange } from '../wordSelection.js';
import { asRectList, mountLayers, rect } from './wordSelection.helpers.js';

describe('selectionFromWordRange', () => {
  const originalGetClientRects = Range.prototype.getClientRects;

  afterEach(() => {
    document.body.innerHTML = '';
    Range.prototype.getClientRects = originalGetClientRects;
    jest.restoreAllMocks();
  });

  it('selects the inclusive word range and maps rectangles to the page region', () => {
    const root = mountLayers(`
      <div data-region-selector-id="3">
        <div class="textLayer"><span>one two three</span></div>
      </div>
    `);
    const words = collectPdfWords(root);
    const region = root.querySelector('[data-region-selector-id]') as HTMLElement;

    jest
      .spyOn(region, 'getBoundingClientRect')
      .mockReturnValue(rect({ left: 10, top: 20, width: 200, height: 100 }));
    Range.prototype.getClientRects = () =>
      asRectList([rect({ left: 15, top: 24, width: 30, height: 10 })]);

    const selection = selectionFromWordRange({ words, startIndex: 0, endIndex: 2, root });

    expect(selection.text).toBe('one two three');
    expect(selection.selectionRectangles).toEqual([
      { left: 5, top: 4, width: 30, height: 10, regionId: '3' },
    ]);
  });

  it('normalizes a backwards range the same way a calendar does', () => {
    const root = mountLayers(`
      <div data-region-selector-id="1">
        <div class="textLayer"><span>one two three</span></div>
      </div>
    `);
    const words = collectPdfWords(root);
    const region = root.querySelector('[data-region-selector-id]') as HTMLElement;
    jest
      .spyOn(region, 'getBoundingClientRect')
      .mockReturnValue(rect({ left: 0, top: 0, width: 200, height: 100 }));
    Range.prototype.getClientRects = () =>
      asRectList([rect({ left: 0, top: 0, width: 10, height: 10 })]);

    expect(selectionFromWordRange({ words, startIndex: 2, endIndex: 0, root }).text).toBe(
      'one two three'
    );
  });

  it('joins words across rendered pages in reading order', () => {
    const root = mountLayers(`
      <div data-region-selector-id="1">
        <div class="textLayer"><span>alpha beta</span></div>
      </div>
      <div data-region-selector-id="2">
        <div class="textLayer"><span>gamma</span></div>
      </div>
    `);
    const words = collectPdfWords(root);
    root.querySelectorAll('[data-region-selector-id]').forEach(region => {
      jest
        .spyOn(region, 'getBoundingClientRect')
        .mockReturnValue(rect({ left: 0, top: 0, width: 200, height: 100 }));
    });
    Range.prototype.getClientRects = () =>
      asRectList([rect({ left: 0, top: 0, width: 10, height: 10 })]);

    expect(selectionFromWordRange({ words, startIndex: 1, endIndex: 2, root }).text).toBe(
      'beta gamma'
    );
  });

  it('keeps only word boxes when a cross-page range would include page-sized client rects', () => {
    const root = mountLayers(`
      <div data-region-selector-id="1">
        <div class="textLayer"><span>alpha beta</span></div>
      </div>
      <div data-region-selector-id="2">
        <div class="textLayer"><span>gamma</span></div>
      </div>
    `);
    const words = collectPdfWords(root);
    const regions = root.querySelectorAll('[data-region-selector-id]');
    jest
      .spyOn(regions[0], 'getBoundingClientRect')
      .mockReturnValue(rect({ left: 0, top: 0, width: 200, height: 400 }));
    jest
      .spyOn(regions[1], 'getBoundingClientRect')
      .mockReturnValue(rect({ left: 0, top: 420, width: 200, height: 400 }));

    Range.prototype.getClientRects = function mockRects() {
      if (this.startContainer !== this.endContainer) {
        return asRectList([rect({ left: 0, top: 0, width: 200, height: 820 })]);
      }
      if (this.startContainer === words[2].node) {
        return asRectList([rect({ left: 8, top: 430, width: 48, height: 12 })]);
      }
      if (this.startOffset >= 6) {
        return asRectList([rect({ left: 48, top: 10, width: 36, height: 12 })]);
      }
      return asRectList([rect({ left: 0, top: 10, width: 40, height: 12 })]);
    };

    const selection = selectionFromWordRange({ words, startIndex: 1, endIndex: 2, root });

    expect(selection.text).toBe('beta gamma');
    expect(selection.selectionRectangles).toEqual([
      { left: 48, top: 10, width: 36, height: 12, regionId: '1' },
      { left: 8, top: 10, width: 48, height: 12, regionId: '2' },
    ]);
  });

  it('uses the text-layer span box when a word range reports a page-sized rect', () => {
    const root = mountLayers(`
      <div data-region-selector-id="2">
        <div class="textLayer"><span>gamma</span></div>
      </div>
    `);
    const words = collectPdfWords(root);
    const region = root.querySelector('[data-region-selector-id]') as HTMLElement;
    const span = root.querySelector('span') as HTMLElement;
    jest
      .spyOn(region, 'getBoundingClientRect')
      .mockReturnValue(rect({ left: 0, top: 420, width: 200, height: 400 }));
    jest
      .spyOn(span, 'getBoundingClientRect')
      .mockReturnValue(rect({ left: 8, top: 430, width: 48, height: 12 }));
    Range.prototype.getClientRects = () =>
      asRectList([rect({ left: 0, top: 420, width: 200, height: 400 })]);

    expect(selectionFromWordRange({ words, startIndex: 0, endIndex: 0, root })).toEqual({
      text: 'gamma',
      selectionRectangles: [{ left: 8, top: 10, width: 48, height: 12, regionId: '2' }],
    });
  });
});
