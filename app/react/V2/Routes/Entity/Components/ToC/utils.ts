import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { TocSchema } from '#shared/types/commonTypes.js';
import type { ProcessedTocEntry } from './types.js';

const convertTextSelectionToTocEntry = (selection: TextSelection): TocSchema => ({
  label: selection.text?.trim() || '',
  selectionRectangles: selection.selectionRectangles.map(rect => ({
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    page: rect.regionId,
  })),
  indentation: 0,
});

const getPageNumber = (entry: TocSchema): number | null => {
  const page = entry.selectionRectangles?.find(rect => rect.page)?.page;
  if (!page) {
    return null;
  }
  const parsed = Number.parseInt(page, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const getPosition = (entry: TocSchema): { top: number; left: number } | null => {
  const rect = entry.selectionRectangles?.find(r => r.page);
  if (!rect) {
    return null;
  }
  return { top: rect.top ?? 0, left: rect.left ?? 0 };
};

type TocSortEntry = {
  originalIndex: number;
  pageNumber: number | null;
  position: { top: number; left: number } | null;
};

function comparePageNumbers(a: TocSortEntry, b: TocSortEntry): number | null {
  if (a.pageNumber === null && b.pageNumber === null) {
    return a.originalIndex - b.originalIndex;
  }
  if (a.pageNumber === null) {
    return 1;
  }
  if (b.pageNumber === null) {
    return -1;
  }
  if (a.pageNumber !== b.pageNumber) {
    return a.pageNumber - b.pageNumber;
  }
  return null;
}

function comparePositions(a: TocSortEntry, b: TocSortEntry): number | null {
  if (!a.position && !b.position) {
    return a.originalIndex - b.originalIndex;
  }
  if (!a.position || !b.position) {
    return !a.position ? 1 : -1;
  }
  if (a.position.top !== b.position.top) {
    return a.position.top - b.position.top;
  }
  if (a.position.left !== b.position.left) {
    return a.position.left - b.position.left;
  }
  return null;
}

function compareTocEntries(a: TocSortEntry, b: TocSortEntry): number {
  const pageComparison = comparePageNumbers(a, b);
  if (pageComparison !== null) {
    return pageComparison;
  }
  const positionComparison = comparePositions(a, b);
  if (positionComparison !== null) {
    return positionComparison;
  }
  return a.originalIndex - b.originalIndex;
}

const normalizeToc = (toc?: TocSchema[]): ProcessedTocEntry[] => {
  if (!toc || !toc.length) {
    return [];
  }

  // Create entries with original index for reference
  const entriesWithOriginalIndex = toc.map((entry, originalIndex) => ({
    entry,
    originalIndex,
    pageNumber: getPageNumber(entry),
    position: getPosition(entry),
  }));

  const sortedEntries = [...entriesWithOriginalIndex].sort(compareTocEntries);

  // Now process parent-child relationships based on sorted order
  let currentTopIndex = -1;

  return sortedEntries.map(({ entry, originalIndex }, index) => {
    const rawIndentation = entry.indentation ?? 0;
    const isTopLevel = rawIndentation === 0;

    if (isTopLevel) {
      currentTopIndex = index;
    }

    return {
      entry,
      index,
      originalIndex,
      indentation: Math.max(rawIndentation, 0),
      topIndex: currentTopIndex,
      isTopLevel,
    };
  });
};

const findItemsWithChildren = (normalizedToc: ProcessedTocEntry[]): number[] =>
  normalizedToc
    .filter(item =>
      // Check if this item has direct children
      normalizedToc.some(
        otherItem =>
          otherItem.index > item.index &&
          otherItem.topIndex === item.topIndex &&
          otherItem.indentation > item.indentation &&
          // Make sure there's no sibling between this item and the potential child
          !normalizedToc.some(
            betweenItem =>
              betweenItem.index > item.index &&
              betweenItem.index < otherItem.index &&
              betweenItem.topIndex === item.topIndex &&
              betweenItem.indentation <= item.indentation
          )
      )
    )
    .map(item => item.index);

const hasDirectChildren = (
  item: ProcessedTocEntry,
  normalizedToc: ProcessedTocEntry[]
): boolean => {
  const nextItem = normalizedToc.find(otherItem => otherItem.index > item.index);
  return (
    nextItem !== undefined &&
    nextItem.topIndex === item.topIndex &&
    nextItem.indentation > item.indentation
  );
};

const findAllAncestors = (
  currentItem: ProcessedTocEntry,
  normalizedToc: ProcessedTocEntry[]
): ProcessedTocEntry[] => {
  if (currentItem.isTopLevel) {
    return [];
  }

  const ancestors: ProcessedTocEntry[] = [];
  let currentIndentation = currentItem.indentation;

  for (let i = currentItem.index - 1; i >= 0; i -= 1) {
    const candidate = normalizedToc[i];
    if (candidate.topIndex === currentItem.topIndex && candidate.indentation < currentIndentation) {
      ancestors.push(candidate);
      currentIndentation = candidate.indentation;
      if (candidate.isTopLevel) {
        break;
      }
    }
  }

  return ancestors.reverse();
};

/** Active entry = the latest ToC entry whose page <= currentPage. */
const findActivePath = (
  normalizedToc: ProcessedTocEntry[],
  currentPage?: number
): { activeIndex: number | null; activeAncestorIndexes: Set<number> } => {
  if (currentPage === undefined || normalizedToc.length === 0) {
    return { activeIndex: null, activeAncestorIndexes: new Set() };
  }

  let active: ProcessedTocEntry | undefined;
  for (const item of normalizedToc) {
    const page = getPageNumber(item.entry);
    if (page !== null && page <= currentPage) {
      active = item;
    } else if (page !== null && page > currentPage) {
      break;
    }
  }

  if (!active) {
    return { activeIndex: null, activeAncestorIndexes: new Set() };
  }

  const ancestors = findAllAncestors(active, normalizedToc);
  return {
    activeIndex: active.index,
    activeAncestorIndexes: new Set(ancestors.map(ancestor => ancestor.index)),
  };
};

export {
  convertTextSelectionToTocEntry,
  getPageNumber,
  normalizeToc,
  findItemsWithChildren,
  hasDirectChildren,
  findAllAncestors,
  findActivePath,
};
