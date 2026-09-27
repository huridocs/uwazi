/**
 * @jest-environment jsdom
 */

import { collectPdfWords, findWordIndex, findWordAtPoint } from '../wordSelection.js';
import { asRectList, mountLayers, rect } from './wordSelection.helpers.js';

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
      Range.prototype.getClientRects = function mockRects() {
        if (this.startOffset >= 6) {
          return asRectList([rect({ left: 0, top: 0, width: 40, height: 20 })]);
        }
        return asRectList([rect({ left: 0, top: 0, width: 8, height: 12 })]);
      };

      expect(findWordAtPoint(words, 10, 10)).toBe(1);
    });

    it('ignores a caret that is not actually under the pointer', () => {
      const root = mountLayers(`
        <div data-region-selector-id="1">
          <div class="textLayer"><span>alpha</span></div>
        </div>
        <div data-region-selector-id="2">
          <div class="textLayer"><span>gamma</span></div>
        </div>
      `);
      const words = collectPdfWords(root);
      const gammaNode = words[1].node;

      Object.defineProperty(document, 'caretPositionFromPoint', {
        configurable: true,
        value: () => ({ offsetNode: gammaNode, offset: 0 }),
      });
      Range.prototype.getClientRects = function mockRects() {
        if (this.startContainer === gammaNode) {
          return asRectList([rect({ left: 0, top: 430, width: 48, height: 12 })]);
        }
        return asRectList([rect({ left: 0, top: 10, width: 40, height: 12 })]);
      };

      expect(findWordAtPoint(words, 20, 200)).toBe(-1);
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
});
