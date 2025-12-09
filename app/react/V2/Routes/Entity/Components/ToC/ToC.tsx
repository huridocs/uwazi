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

const normalizeToc = (toc?: TocSchema[]): ProcessedTocEntry[] => {
  if (!toc || !toc.length) {
    return [];
  }

  let currentTopIndex = -1;

  return toc.map((entry, index) => {
    const rawIndentation = entry.indentation ?? 0;
    const isTopLevel = rawIndentation === 0;

    if (isTopLevel) {
      currentTopIndex = index;
    }

    return {
      entry,
      index,
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
  ({ toc, onClick, onStateChange, isEditMode = false, onIndentationChange, onDelete, onLabelChange }, ref) => {
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

export { ToC };
export type { ToCProps, ToCRef };
export type { ProcessedTocEntry } from './types';
