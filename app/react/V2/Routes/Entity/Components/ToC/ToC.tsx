/* eslint-disable max-lines, react/require-default-props */
import React, {
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useEffect,
} from 'react';
import { TocSchema } from 'shared/types/commonTypes';
import { ToCItem } from './ToCItem';
import type { ProcessedTocEntry } from './types';

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

// Sort ToC entries by page, then by position (top, then left)
const sortTocEntries = (toc: TocSchema[]): TocSchema[] => {
  const entriesWithIndex = toc.map((entry, index) => ({
    entry,
    originalIndex: index,
    pageNumber: getPageNumber(entry),
    position: getPosition(entry),
  }));

  const sortedEntries = [...entriesWithIndex].sort((a, b) => {
    // Handle entries without page numbers - put them at the end
    if (a.pageNumber === null && b.pageNumber === null) {
      return a.originalIndex - b.originalIndex; // Maintain original order
    }
    if (a.pageNumber === null) {
      return 1; // a goes after b
    }
    if (b.pageNumber === null) {
      return -1; // a goes before b
    }

    // Compare by page number
    if (a.pageNumber !== b.pageNumber) {
      return a.pageNumber - b.pageNumber;
    }

    // Same page - compare by position
    if (!a.position && !b.position) {
      return a.originalIndex - b.originalIndex;
    }
    if (!a.position) {
      return 1;
    }
    if (!b.position) {
      return -1;
    }

    // Compare by top position first
    if (a.position.top !== b.position.top) {
      return a.position.top - b.position.top;
    }

    // Same top position - compare by left position
    if (a.position.left !== b.position.left) {
      return a.position.left - b.position.left;
    }

    // Same position - maintain original order
    return a.originalIndex - b.originalIndex;
  });

  return sortedEntries.map(({ entry }) => entry);
};

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

  // Sort by page number first, then by position (top, then left)
  const sortedEntries = [...entriesWithOriginalIndex].sort((a, b) => {
    // Handle entries without page numbers - put them at the end
    if (a.pageNumber === null && b.pageNumber === null) {
      return a.originalIndex - b.originalIndex; // Maintain original order
    }
    if (a.pageNumber === null) {
      return 1; // a goes after b
    }
    if (b.pageNumber === null) {
      return -1; // a goes before b
    }

    // Compare by page number
    if (a.pageNumber !== b.pageNumber) {
      return a.pageNumber - b.pageNumber;
    }

    // Same page - compare by position
    if (!a.position && !b.position) {
      return a.originalIndex - b.originalIndex;
    }
    if (!a.position) {
      return 1;
    }
    if (!b.position) {
      return -1;
    }

    // Compare by top position first
    if (a.position.top !== b.position.top) {
      return a.position.top - b.position.top;
    }

    // Same top position - compare by left position
    if (a.position.left !== b.position.left) {
      return a.position.left - b.position.left;
    }

    // Same position - maintain original order
    return a.originalIndex - b.originalIndex;
  });

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

type ToCRef = {
  expandAll: () => void;
  collapseAll: () => void;
  isAllExpanded: () => boolean;
  isAllCollapsed: () => boolean;
};

type ToCProps = {
  toc?: TocSchema[];
  onClick?: (entry: ProcessedTocEntry) => void;
  onStateChange?: (isAllExpanded: boolean, isAllCollapsed: boolean) => void;
  isEditMode?: boolean;
  onIndentationChange?: (index: number, newIndentation: number) => void;
  onDelete?: (index: number) => void;
  onLabelChange?: (index: number, newLabel: string) => void;
};

const ToC = forwardRef<ToCRef, ToCProps>(
  (
    {
      toc,
      onClick,
      onStateChange,
      isEditMode = false,
      onIndentationChange,
      onDelete,
      onLabelChange,
    },
    ref
  ) => {
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const normalizedToc = useMemo(() => normalizeToc(toc), [toc]);

    // Get all items that have children (at any level)
    const itemsWithChildren = useMemo(
      () =>
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
          .map(item => item.index),
      [normalizedToc]
    );

    const isAllExpanded = useCallback(() => {
      if (itemsWithChildren.length === 0) {
        return true; // No items to expand, consider as "all expanded"
      }
      return itemsWithChildren.every(index => expanded[index] === true);
    }, [itemsWithChildren, expanded]);

    const isAllCollapsed = useCallback(() => {
      if (itemsWithChildren.length === 0) {
        return true; // No items to collapse, consider as "all collapsed"
      }
      return itemsWithChildren.every(index => expanded[index] !== true);
    }, [itemsWithChildren, expanded]);

    const expandAll = useCallback(() => {
      const allExpanded: Record<number, boolean> = {};
      itemsWithChildren.forEach(index => {
        allExpanded[index] = true;
      });
      setExpanded(allExpanded);
    }, [itemsWithChildren]);

    const collapseAll = useCallback(() => {
      setExpanded({});
    }, []);

    useImperativeHandle(ref, () => ({
      expandAll,
      collapseAll,
      isAllExpanded,
      isAllCollapsed,
    }));

    // Auto-expand all when entering edit mode
    useEffect(() => {
      if (isEditMode) {
        const allExpandedState: Record<number, boolean> = {};
        itemsWithChildren.forEach(index => {
          allExpandedState[index] = true;
        });
        setExpanded(allExpandedState);
      }
    }, [isEditMode, itemsWithChildren]);

    // Notify parent component when state changes
    useEffect(() => {
      if (onStateChange) {
        onStateChange(isAllExpanded(), isAllCollapsed());
      }
    }, [expanded, isAllExpanded, isAllCollapsed, onStateChange]);

    const toggleExpand = (topIndex: number) => {
      setExpanded(prev => ({ ...prev, [topIndex]: !prev[topIndex] }));
    };

    return (
      <>
        {normalizedToc.map(item => (
          <ToCItem
            key={`toc-${item.index}`}
            item={item}
            normalizedToc={normalizedToc}
            expanded={expanded}
            isEditMode={isEditMode}
            onClick={onClick}
            onIndentationChange={onIndentationChange}
            onDelete={onDelete}
            onLabelChange={onLabelChange}
            toggleExpand={toggleExpand}
          />
        ))}
      </>
    );
  }
);

ToC.displayName = 'ToC';

export { ToC, sortTocEntries };
export type { ToCProps, ToCRef };
export type { ProcessedTocEntry } from './types';
