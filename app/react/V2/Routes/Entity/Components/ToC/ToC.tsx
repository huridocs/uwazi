/* eslint-disable max-lines, react/require-default-props */
import React, { useMemo, useEffect } from 'react';
import { TocSchema } from 'shared/types/commonTypes';
import { ToCItem } from './ToCItem';
import type { ProcessedTocEntry } from './types';
import { normalizeToc, findItemsWithChildren } from './utils';

// Sort ToC entries by page, then by position (top, then left)
const sortTocEntries = (toc: TocSchema[]): TocSchema[] => {
  const normalized = normalizeToc(toc);
  return normalized.map(({ entry }) => entry);
};

type ToCProps = {
  toc?: TocSchema[];
  expanded: Record<number, boolean>;
  onToggleExpand: (index: number) => void;
  onClick?: (entry: ProcessedTocEntry) => void;
  onStateChange?: (isAllExpanded: boolean, isAllCollapsed: boolean) => void;
  isEditMode?: boolean;
  onIndentationChange?: (index: number, newIndentation: number) => void;
  onDelete?: (index: number) => void;
  onLabelChange?: (index: number, newLabel: string) => void;
};

const ToC = ({
  toc,
  expanded,
  onToggleExpand,
  onClick,
  onStateChange,
  isEditMode = false,
  onIndentationChange,
  onDelete,
  onLabelChange,
}: ToCProps) => {
  const normalizedToc = useMemo(() => normalizeToc(toc), [toc]);

  // Get all items that have children (at any level)
  const itemsWithChildren = useMemo(() => findItemsWithChildren(normalizedToc), [normalizedToc]);

  const isAllExpanded = useMemo(() => {
    if (itemsWithChildren.length === 0) {
      return true; // No items to expand, consider as "all expanded"
    }
    return itemsWithChildren.every(index => expanded[index] === true);
  }, [itemsWithChildren, expanded]);

  const isAllCollapsed = useMemo(() => {
    if (itemsWithChildren.length === 0) {
      return true; // No items to collapse, consider as "all collapsed"
    }
    return itemsWithChildren.every(index => expanded[index] !== true);
  }, [itemsWithChildren, expanded]);

  // Notify parent component when state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(isAllExpanded, isAllCollapsed);
    }
  }, [expanded, isAllExpanded, isAllCollapsed, onStateChange]);

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
          toggleExpand={onToggleExpand}
        />
      ))}
    </>
  );
};

ToC.displayName = 'ToC';

export { ToC, sortTocEntries };
export type { ToCProps };
export type { ProcessedTocEntry } from './types';
