/**
 * @jest-environment jsdom
 */

import {
  collectPdfWords,
  findWordIndex,
  findWordAtPoint,
  selectionFromWordRange,
} from '../wordSelection.js';

const rect = ({
  left,
  top,
  width,
  height,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
}): DOMRect =>
  ({
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  }) as DOMRect;

const asRectList = (rects: DOMRect[]): DOMRectList =>
  Object.assign(rects, {
    item: (index: number) => rects[index] ?? null,
  }) as unknown as DOMRectList;

const mountLayers = (html: string) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
};

describe('wordSelection', () => {
  const originalGetClientRects = Range.prototype.getClientRects;

  afterEach(() => {
    document.body.innerHTML = '';
    Range.prototype.getClientRects = originalGetClientRects;
    jest.restoreAllMocks();
  });

  describe('collectPdfWords', () => {
    it('splits textLayer spans into reading-order words with region ids', () => {
      const root = mountLayers(`
        <div data-region-selector-id="1">
          <div class="textLayer">
            <span>Hello world</span>
            <span>foo</span>
          </div>
        </div>
        <div data-region-selector-id="2">
          <div class="textLayer">
            <span>Bar baz</span>
          </div>
        </div>
      `);

      const words = collectPdfWords(root);

      expect(words.map(word => ({ text: word.text, regionId: word.regionId }))).toEqual([
        { text: 'Hello', regionId: '1' },
        { text: 'world', regionId: '1' },
        { text: 'foo', regionId: '1' },
        { text: 'Bar', regionId: '2' },
        { text: 'baz', regionId: '2' },
      ]);
    });

    it('walks through snippet mark wrappers without losing words', () => {
      const root = mountLayers(`
        <div data-region-selector-id="1">
          <div class="textLayer">
            <span>Hello <mark class="snippet-search-term">world</mark> again</span>
          </div>
        </div>
      `);

      expect(collectPdfWords(root).map(word => word.text)).toEqual(['Hello', 'world', 'again']);
    });

    it('ignores empty text layers', () => {
      const root = mountLayers(`
        <div data-region-selector-id="1">
          <div class="textLayer"></div>
        </div>
      `);

      expect(collectPdfWords(root)).toEqual([]);
    });
  });

  describe('findWordIndex', () => {
    it('returns the word that contains a caret inside a span', () => {
      const root = mountLayers(`
        <div data-region-selector-id="1">
          <div class="textLayer"><span>Hello world</span></div>
        </div>
      `);
      const words = collectPdfWords(root);
      const textNode = root.querySelector('span')?.firstChild as Text;

      expect(findWordIndex(words, textNode, 0)).toBe(0);
      expect(findWordIndex(words, textNode, 4)).toBe(0);
      expect(findWordIndex(words, textNode, 6)).toBe(1);
    });

    it('returns -1 when the caret is not on a word', () => {
      const root = mountLayers(`
        <div data-region-selector-id="1">
          <div class="textLayer"><span>Hello world</span></div>
        </div>
      `);
      const words = collectPdfWords(root);

      expect(findWordIndex(words, root, 0)).toBe(-1);
    });
  });

  describe('findWordAtPoint', () => {
    it('resolves the word under a point via caretPositionFromPoint', () => {
      const root = mountLayers(`
        <div data-region-selector-id="1">
          <div class="textLayer"><span>Hello world</span></div>
        </div>
      `);
      const words = collectPdfWords(root);
      const textNode = root.querySelector('span')?.firstChild as Text;

      Object.defineProperty(document, 'caretPositionFromPoint', {
        configurable: true,
        value: () => ({ offsetNode: textNode, offset: 7 }),
      });

      expect(findWordAtPoint(words, 10, 10)).toBe(1);
    });

    it('falls back to word boxes when caret APIs are missing', () => {
      const root = mountLayers(`
        <div data-region-selector-id="1">
          <div class="textLayer"><span>Hello world</span></div>
        </div>
      `);
      const words = collectPdfWords(root);

      Object.defineProperty(document, 'caretPositionFromPoint', {
        configurable: true,
        value: undefined,
      });
      Object.defineProperty(document, 'caretRangeFromPoint', {
        configurable: true,
        value: undefined,
      });

      Range.prototype.getClientRects = function mockRects() {
        const start = this.startOffset;
        if (start < 5) {
          return asRectList([rect({ left: 0, top: 0, width: 40, height: 12 })]);
        }
        return asRectList([rect({ left: 48, top: 0, width: 40, height: 12 })]);
      };

      expect(findWordAtPoint(words, 55, 6)).toBe(1);
      expect(findWordAtPoint(words, 10, 6)).toBe(0);
      expect(findWordAtPoint(words, 400, 400)).toBe(-1);
    });
  });

  describe('selectionFromWordRange', () => {
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
  });
});
