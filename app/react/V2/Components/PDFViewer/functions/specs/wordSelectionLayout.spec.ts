/**
 * @jest-environment jsdom
 */

import { collectPdfWords } from '../wordSelection.js';
import {
  buildWordLayout,
  createWordLayoutCache,
  findWordAtPointInLayout,
  selectionFromLayout,
} from '../wordSelectionLayout.js';
import { asRectList, mockFullSpanClientRects, mountLayers, rect } from './wordSelection.helpers.js';

describe('wordSelectionLayout', () => {
  const originalGetClientRects = Range.prototype.getClientRects;

  afterEach(() => {
    document.body.innerHTML = '';
    Range.prototype.getClientRects = originalGetClientRects;
    jest.restoreAllMocks();
  });

  const mountThreeWords = () => {
    const root = mountLayers(`
      <div data-region-selector-id="1">
        <div class="textLayer"><span>one two three</span></div>
      </div>
    `);
    mockFullSpanClientRects(root, rect({ left: 0, top: 0, width: 130, height: 12 }));
    return root;
  };

  it('hit-tests from cached page-relative boxes without measuring again', () => {
    const root = mountThreeWords();
    const getClientRects = jest.fn(Range.prototype.getClientRects);
    Range.prototype.getClientRects = function mockRects() {
      return getClientRects.call(this);
    };

    const layout = buildWordLayout(root, collectPdfWords);
    const measured = getClientRects.mock.calls.length;
    expect(measured).toBeGreaterThan(0);
    expect(findWordAtPointInLayout(layout, 50, 6)).toBe(1);
    expect(findWordAtPointInLayout(layout, 10, 6)).toBe(0);
    expect(getClientRects).toHaveBeenCalledTimes(measured);
  });

  it('builds a selection from cached boxes', () => {
    const root = mountThreeWords();
    const layout = buildWordLayout(root, collectPdfWords);

    expect(selectionFromLayout(layout, 1, 1)).toEqual({
      text: 'two',
      selectionRectangles: [{ left: 40, top: 0, width: 30, height: 12, regionId: '1' }],
    });
  });

  const measureCache = (root: HTMLElement) => {
    const getClientRects = jest.fn(() =>
      asRectList([rect({ left: 0, top: 0, width: 130, height: 12 })])
    );
    Range.prototype.getClientRects = getClientRects as typeof Range.prototype.getClientRects;
    return { cache: createWordLayoutCache(root, collectPdfWords), getClientRects };
  };

  it('rebuilds only after the cache is invalidated', () => {
    const { cache, getClientRects } = measureCache(mountThreeWords());
    cache.get();
    const measured = getClientRects.mock.calls.length;
    cache.get();
    expect(getClientRects).toHaveBeenCalledTimes(measured);

    cache.invalidate();
    cache.get();
    expect(getClientRects.mock.calls.length).toBeGreaterThan(measured);
  });
});
