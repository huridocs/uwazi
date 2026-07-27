/* eslint-disable react/require-default-props */
import React, { useMemo, useEffect } from 'react';
import { TocSchema } from '#shared/types/commonTypes.js';
import { ToCItem } from './ToCItem.js';
import type { ProcessedTocEntry } from './types.js';
import { normalizeToc, findItemsWithChildren, findActivePath } from './utils.js';

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
  currentPage?: number;
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
  currentPage,
  onIndentationChange,
  onDelete,
  onLabelChange,
}: ToCProps) => {
  const normalizedToc = useMemo(() => normalizeToc(toc), [toc]);

  const itemsWithChildren = useMemo(() => findItemsWithChildren(normalizedToc), [normalizedToc]);

  const { activeIndex, activeAncestorIndexes } = useMemo(
    () => findActivePath(normalizedToc, isEditMode ? undefined : currentPage),
    [normalizedToc, currentPage, isEditMode]
  );

  const isAllExpanded = useMemo(() => {
    if (itemsWithChildren.length === 0) {
      return true;
    }
    return itemsWithChildren.every(index => expanded[index] === true);
  }, [itemsWithChildren, expanded]);

  const isAllCollapsed = useMemo(() => {
    if (itemsWithChildren.length === 0) {
      return true;
    }
    return itemsWithChildren.every(index => expanded[index] !== true);
  }, [itemsWithChildren, expanded]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange(isAllExpanded, isAllCollapsed);
    }
  }, [expanded, isAllExpanded, isAllCollapsed, onStateChange]);

  return (
    <div className="pb-8">
      {normalizedToc.map(item => (
        <ToCItem
          key={`toc-${item.index}`}
          item={item}
          normalizedToc={normalizedToc}
          expanded={expanded}
          isEditMode={isEditMode}
          isActive={activeIndex === item.index}
          isOnActivePath={activeAncestorIndexes.has(item.index)}
          onClick={onClick}
          onIndentationChange={onIndentationChange}
          onDelete={onDelete}
          onLabelChange={onLabelChange}
          toggleExpand={onToggleExpand}
        />
      ))}
    </div>
  );
};

ToC.displayName = 'ToC';

export { ToC, sortTocEntries };
export type { ToCProps };
export type { ProcessedTocEntry } from './types.js';
