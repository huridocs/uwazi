import type { SelectionRectangle, TextSelection } from '@huridocs/react-text-selection-handler';
import { mergeLineRectangles } from './mergeLineRectangles.js';

type PdfWord = {
  text: string;
  regionId: string;
  node: Text;
  startOffset: number;
  endOffset: number;
};

const WORD_PATTERN = /\S+/g;

const regionIdFor = (node: Node): string => {
  const region =
    node instanceof Element
      ? node.closest('[data-region-selector-id]')
      : node.parentElement?.closest('[data-region-selector-id]');
  return region?.getAttribute('data-region-selector-id') || '';
};

const collectPdfWords = (root: HTMLElement): PdfWord[] => {
  const layers = Array.from(root.querySelectorAll('.textLayer'));
  const words: PdfWord[] = [];

  layers.forEach(layer => {
    const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (current instanceof Text) {
        const value = current.textContent || '';
        for (const match of value.matchAll(WORD_PATTERN)) {
          const startOffset = match.index ?? 0;
          words.push({
            text: match[0],
            regionId: regionIdFor(current),
            node: current,
            startOffset,
            endOffset: startOffset + match[0].length,
          });
        }
      }
      current = walker.nextNode();
    }
  });

  return words;
};

const findWordIndex = (words: PdfWord[], node: Node, offset: number): number =>
  words.findIndex(word => {
    if (word.node !== node) {
      return false;
    }
    return offset >= word.startOffset && offset <= word.endOffset;
  });

type CaretPositionLike = { offsetNode: Node; offset: number };

const caretFromPoint = (x: number, y: number): CaretPositionLike | undefined => {
  const withPosition = document as Document & {
    caretPositionFromPoint?: (px: number, py: number) => CaretPositionLike | null;
    caretRangeFromPoint?: (px: number, py: number) => Range | null;
  };

  const position = withPosition.caretPositionFromPoint?.(x, y);
  if (position) {
    return position;
  }

  const range = withPosition.caretRangeFromPoint?.(x, y);
  if (range) {
    return { offsetNode: range.startContainer, offset: range.startOffset };
  }

  return undefined;
};

const wordContainsPoint = (word: PdfWord, x: number, y: number): boolean => {
  const range = document.createRange();
  range.setStart(word.node, word.startOffset);
  range.setEnd(word.node, word.endOffset);
  return Array.from(range.getClientRects()).some(
    box => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
  );
};

const findWordAtPoint = (words: PdfWord[], x: number, y: number): number => {
  const caret = caretFromPoint(x, y);
  if (caret) {
    const fromCaret = findWordIndex(words, caret.offsetNode, caret.offset);
    if (fromCaret >= 0) {
      return fromCaret;
    }
  }

  return words.findIndex(word => wordContainsPoint(word, x, y));
};

const orderedRange = (startIndex: number, endIndex: number): [number, number] =>
  startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

const rangeForWords = (words: PdfWord[], startIndex: number, endIndex: number): Range => {
  const [from, to] = orderedRange(startIndex, endIndex);
  const start = words[from];
  const end = words[to];
  const range = document.createRange();
  range.setStart(start.node, start.startOffset);
  range.setEnd(end.node, end.endOffset);
  return range;
};

const regionElementsIn = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll('[data-region-selector-id]'));

const regionContainsRect = (region: HTMLElement, rectangle: DOMRect): boolean => {
  const box = region.getBoundingClientRect();
  return (
    box.x <= rectangle.x &&
    rectangle.x <= box.x + box.width &&
    box.y <= rectangle.y &&
    rectangle.y <= box.y + box.height
  );
};

const rectangleForRegion = (rectangle: DOMRect, region: HTMLElement): SelectionRectangle => {
  const regionBox = region.getBoundingClientRect();
  return {
    left: rectangle.x - regionBox.x,
    top: rectangle.y - regionBox.y,
    width: rectangle.width,
    height: rectangle.height,
    regionId: region.getAttribute('data-region-selector-id') || undefined,
  };
};

type WordRangeSelection = {
  words: PdfWord[];
  startIndex: number;
  endIndex: number;
  root: HTMLElement;
};

const rectanglesForWord = (word: PdfWord, regions: HTMLElement[]): SelectionRectangle[] => {
  const range = document.createRange();
  range.setStart(word.node, word.startOffset);
  range.setEnd(word.node, word.endOffset);
  const region =
    regions.find(element => element.getAttribute('data-region-selector-id') === word.regionId) ||
    undefined;

  return Array.from(range.getClientRects())
    .map(rectangle => {
      const host = region || regions.find(element => regionContainsRect(element, rectangle));
      return host ? rectangleForRegion(rectangle, host) : undefined;
    })
    .filter((rectangle): rectangle is SelectionRectangle => Boolean(rectangle));
};

const selectionFromWordRange = ({
  words,
  startIndex,
  endIndex,
  root,
}: WordRangeSelection): TextSelection => {
  const [from, to] = orderedRange(startIndex, endIndex);
  const selectedWords = words.slice(from, to + 1);
  const regions = regionElementsIn(root);

  return {
    text: selectedWords.map(word => word.text).join(' '),
    selectionRectangles: mergeLineRectangles(
      selectedWords.flatMap(word => rectanglesForWord(word, regions))
    ),
  };
};

export type { PdfWord, WordRangeSelection };
export { collectPdfWords, findWordIndex, findWordAtPoint, selectionFromWordRange, rangeForWords };
