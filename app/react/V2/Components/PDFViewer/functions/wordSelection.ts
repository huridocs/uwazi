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

const SIZE_TOLERANCE_PX = 2;

const fitsInside = (inner: DOMRect, outer: DOMRect) =>
  inner.width > 0 &&
  inner.height > 0 &&
  inner.width <= outer.width + SIZE_TOLERANCE_PX &&
  inner.height <= outer.height + SIZE_TOLERANCE_PX;

const sameSize = (left: DOMRect, right: DOMRect) =>
  Math.abs(left.width - right.width) <= SIZE_TOLERANCE_PX &&
  Math.abs(left.height - right.height) <= SIZE_TOLERANCE_PX;

const coversWholeNode = (word: PdfWord) =>
  word.startOffset === 0 && word.endOffset === (word.node.textContent || '').length;

const isUsableWordRect = (box: DOMRect, word: PdfWord, spanBox: DOMRect) => {
  if (!fitsInside(box, spanBox)) {
    return false;
  }
  return coversWholeNode(word) || !sameSize(box, spanBox);
};

const rangeRectsForWord = (word: PdfWord): DOMRect[] => {
  const range = document.createRange();
  range.setStart(word.node, word.startOffset);
  range.setEnd(word.node, word.endOffset);
  return Array.from(range.getClientRects());
};

const sliceHostBox = (host: DOMRect, startRatio: number, widthRatio: number): DOMRect => {
  const left = host.left + host.width * startRatio;
  const width = Math.max(host.width * widthRatio, 1);
  return {
    x: left,
    y: host.top,
    left,
    top: host.top,
    width,
    height: host.height,
    right: left + width,
    bottom: host.top + host.height,
    toJSON: () => ({}),
  } as DOMRect;
};

const estimateWordRect = (word: PdfWord, spanBox: DOMRect): DOMRect => {
  if (coversWholeNode(word)) {
    return spanBox;
  }

  const total = Math.max((word.node.textContent || '').length, 1);
  return sliceHostBox(
    spanBox,
    word.startOffset / total,
    (word.endOffset - word.startOffset) / total
  );
};

const clientRectsForWord = (word: PdfWord): DOMRect[] => {
  const spanBox = word.node.parentElement?.getBoundingClientRect();
  const rangeRects = rangeRectsForWord(word);
  if (!spanBox) {
    return rangeRects.filter(box => box.width > 0 && box.height > 0);
  }

  const usable = rangeRects.filter(box => isUsableWordRect(box, word, spanBox));
  if (usable.length) {
    return usable;
  }
  if (spanBox.width > 0 && spanBox.height > 0) {
    return [estimateWordRect(word, spanBox)];
  }
  return rangeRects.filter(box => box.width > 0 && box.height > 0);
};

const wordContainsPoint = (word: PdfWord, x: number, y: number): boolean =>
  clientRectsForWord(word).some(
    box => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
  );

const findWordAtPoint = (words: PdfWord[], x: number, y: number): number => {
  const caret = caretFromPoint(x, y);
  if (caret) {
    const fromCaret = findWordIndex(words, caret.offsetNode, caret.offset);
    if (fromCaret >= 0 && wordContainsPoint(words[fromCaret], x, y)) {
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
  const region =
    regions.find(element => element.getAttribute('data-region-selector-id') === word.regionId) ||
    undefined;

  return clientRectsForWord(word)
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
export {
  collectPdfWords,
  findWordIndex,
  findWordAtPoint,
  selectionFromWordRange,
  rangeForWords,
  caretFromPoint,
  clientRectsForWord,
  regionElementsIn,
  regionContainsRect,
  rectangleForRegion,
};
