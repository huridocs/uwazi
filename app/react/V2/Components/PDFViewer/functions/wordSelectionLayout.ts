import type { SelectionRectangle, TextSelection } from '@huridocs/react-text-selection-handler';
import { mergeLineRectangles } from './mergeLineRectangles.js';
import {
  caretFromPoint,
  clientRectsForWord,
  collectPdfWords,
  findWordIndex,
  rectangleForRegion,
  regionContainsRect,
  regionElementsIn,
  type PdfWord,
} from './wordSelection.js';

type WordLayout = {
  words: PdfWord[];
  boxes: SelectionRectangle[][];
  regionMap: Map<string, HTMLElement>;
};

type CollectWords = (root: HTMLElement) => PdfWord[];

const orderedRange = (startIndex: number, endIndex: number): [number, number] =>
  startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

const rectanglesForCachedWord = (
  word: PdfWord,
  regionMap: Map<string, HTMLElement>,
  regions: HTMLElement[]
): SelectionRectangle[] => {
  const region = regionMap.get(word.regionId);
  return clientRectsForWord(word)
    .map(rectangle => {
      const host = region || regions.find(element => regionContainsRect(element, rectangle));
      return host ? rectangleForRegion(rectangle, host) : undefined;
    })
    .filter((rectangle): rectangle is SelectionRectangle => Boolean(rectangle));
};

const buildWordLayout = (
  root: HTMLElement,
  collectWords: CollectWords = collectPdfWords
): WordLayout => {
  const words = collectWords(root);
  const regions = regionElementsIn(root);
  const regionMap = new Map(
    regions.map(region => [region.getAttribute('data-region-selector-id') || '', region])
  );

  return {
    words,
    regionMap,
    boxes: words.map(word => rectanglesForCachedWord(word, regionMap, regions)),
  };
};

const regionOrigin = (layout: WordLayout, regionId?: string) => {
  const region = regionId ? layout.regionMap.get(regionId) : undefined;
  return region?.getBoundingClientRect();
};

const boxContainsPoint = (
  box: SelectionRectangle,
  origin: DOMRect,
  point: { x: number; y: number }
) => {
  const left = origin.x + box.left;
  const top = origin.y + box.top;
  return (
    point.x >= left && point.x <= left + box.width && point.y >= top && point.y <= top + box.height
  );
};

const layoutContainsPoint = (
  layout: WordLayout,
  wordIndex: number,
  point: { x: number; y: number }
) =>
  (layout.boxes[wordIndex] || []).some(box => {
    const origin = regionOrigin(layout, box.regionId);
    return Boolean(origin && boxContainsPoint(box, origin, point));
  });

const findWordAtPointInLayout = (layout: WordLayout, x: number, y: number): number => {
  const point = { x, y };
  const caret = caretFromPoint(x, y);
  if (caret) {
    const fromCaret = findWordIndex(layout.words, caret.offsetNode, caret.offset);
    if (fromCaret >= 0 && layoutContainsPoint(layout, fromCaret, point)) {
      return fromCaret;
    }
  }

  return layout.words.findIndex((_, index) => layoutContainsPoint(layout, index, point));
};

const selectionFromLayout = (
  layout: WordLayout,
  startIndex: number,
  endIndex: number
): TextSelection => {
  const [from, to] = orderedRange(startIndex, endIndex);
  return {
    text: layout.words
      .slice(from, to + 1)
      .map(word => word.text)
      .join(' '),
    selectionRectangles: mergeLineRectangles(layout.boxes.slice(from, to + 1).flat()),
  };
};

const createWordLayoutCache = (root: HTMLElement, collectWords: CollectWords) => {
  let dirty = true;
  let layout: WordLayout | undefined;

  return {
    invalidate: () => {
      dirty = true;
    },
    get: () => {
      if (!dirty && layout) {
        return layout;
      }
      layout = buildWordLayout(root, collectWords);
      dirty = false;
      return layout;
    },
  };
};

const mutationTouchesTextLayer = (mutation: MutationRecord) =>
  [...mutation.addedNodes, ...mutation.removedNodes].some(node => {
    if (!(node instanceof Element)) {
      return false;
    }
    return (
      node.classList.contains('textLayer') ||
      Boolean(node.closest('.textLayer')) ||
      Boolean(node.querySelector('.textLayer'))
    );
  });

const bindWordLayoutInvalidation = (root: HTMLElement, invalidate: () => void) => {
  const onScroll = () => invalidate();
  root.addEventListener('scroll', onScroll, { capture: true, passive: true });

  let seenInitialResize = false;
  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(() => {
          if (!seenInitialResize) {
            seenInitialResize = true;
            return;
          }
          invalidate();
        });
  resizeObserver?.observe(root);

  const mutationObserver = new MutationObserver(mutations => {
    if (mutations.some(mutationTouchesTextLayer)) {
      invalidate();
    }
  });
  mutationObserver.observe(root, { childList: true, subtree: true });

  return () => {
    root.removeEventListener('scroll', onScroll, true);
    resizeObserver?.disconnect();
    mutationObserver.disconnect();
  };
};

export type { WordLayout, CollectWords };
export {
  buildWordLayout,
  findWordAtPointInLayout,
  selectionFromLayout,
  createWordLayoutCache,
  bindWordLayoutInvalidation,
};
