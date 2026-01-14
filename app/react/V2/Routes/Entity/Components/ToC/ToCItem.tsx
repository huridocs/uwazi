/* eslint-disable max-lines */
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { TriangleIcon } from '../../../../Components/UI/TriangleIcon';
import type { ProcessedTocEntry } from './types';
import { DeleteConfirmation } from './DeleteConfirmation';

const getPageNumber = (entry: { selectionRectangles?: Array<{ page?: string }> }) => {
  const page = entry.selectionRectangles?.find(rect => rect.page)?.page;
  if (!page) {
    return null;
  }
  const parsed = Number.parseInt(page, 10);
  return Number.isNaN(parsed) ? null : parsed;
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

  // Traverse backwards to find all ancestors
  for (let i = currentItem.index - 1; i >= 0; i -= 1) {
    const candidate = normalizedToc[i];
    if (candidate.topIndex === currentItem.topIndex && candidate.indentation < currentIndentation) {
      ancestors.push(candidate);
      currentIndentation = candidate.indentation;
      // If we found a top-level item, we can stop
      if (candidate.isTopLevel) {
        break;
      }
    }
  }

  return ancestors.reverse(); // Return in order from top to bottom
};

const hasDirectChildren = (
  item: ProcessedTocEntry,
  normalizedToc: ProcessedTocEntry[]
): boolean => {
  // Find the next item after this one
  const nextItem = normalizedToc.find(otherItem => otherItem.index > item.index);
  // It's a direct child if it has more indentation and same topIndex
  return (
    nextItem !== undefined &&
    nextItem.topIndex === item.topIndex &&
    nextItem.indentation > item.indentation
  );
};

const getInteractiveProps = (
  isInteractive: boolean,
  handleEntryClick: () => void
): Record<string, unknown> => {
  if (!isInteractive) {
    return {};
  }
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: handleEntryClick,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleEntryClick();
      }
    },
  };
};

type EditControlsProps = {
  isEditMode: boolean;
  isFirstEntry: boolean;
  canDecreaseIndentation: boolean;
  canIncreaseIndentation: boolean;
  handleDecreaseIndentation: (e: React.MouseEvent) => void;
  handleIncreaseIndentation: (e: React.MouseEvent) => void;
};

const renderEditControls = (props: EditControlsProps): React.ReactNode => (
  <div className="flex items-center gap-0.5 flex-shrink-0">
    <button
      type="button"
      onClick={props.handleDecreaseIndentation}
      disabled={props.isFirstEntry || !props.canDecreaseIndentation}
      className="w-[20px] h-[20px] rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 transition"
      aria-label="Decrease indentation"
    >
      <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
    </button>
    <button
      type="button"
      onClick={props.handleIncreaseIndentation}
      disabled={props.isFirstEntry || !props.canIncreaseIndentation}
      className="w-[20px] h-[20px] rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 transition"
      aria-label="Increase indentation"
    >
      <ChevronRightIcon className="w-4 h-4 text-gray-600" />
    </button>
  </div>
);

type ExpandButtonProps = {
  hasChildren: boolean;
  isEditMode: boolean;
  isExpanded: boolean;
  toggleExpand: (index: number) => void;
  itemIndex: number;
};

const renderExpandButton = (props: ExpandButtonProps): React.ReactNode => {
  if (!props.hasChildren || props.isEditMode) {
    return null;
  }
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        props.toggleExpand(props.itemIndex);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.toggleExpand(props.itemIndex);
        }
      }}
      className="flex-shrink-0 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 transition cursor-pointer min-w-[20px] h-[20px] items-center justify-center"
      aria-label={props.isExpanded ? 'Collapse section' : 'Expand section'}
      aria-expanded={props.isExpanded}
    >
      <TriangleIcon
        isExpanded={props.isExpanded}
        className={props.isExpanded ? 'text-gray-700' : 'text-gray-400'}
      />
    </button>
  );
};

type RightSideContentProps = {
  pageNumber: number | null;
  isEditMode: boolean;
  handleDelete: () => void;
};

const renderRightSideContent = (props: RightSideContentProps): React.ReactNode => (
  <div className="relative flex items-center gap-2">
    {typeof props.pageNumber === 'number' && !props.isEditMode && (
      <p className="text-xs font-medium text-gray-500 whitespace-nowrap flex-shrink-0">
        {props.pageNumber}
      </p>
    )}
    {props.isEditMode && (
      <DeleteConfirmation
        onConfirm={props.handleDelete}
        triggerButton={
          <button
            type="button"
            className="w-[20px] h-[20px] rounded hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-400 transition cursor-pointer"
            aria-label="Delete entry"
          >
            <TrashIcon className="w-4 h-4 stroke-error-500" />
          </button>
        }
      />
    )}
  </div>
);

export type ToCItemProps = {
  item: ProcessedTocEntry;
  normalizedToc: ProcessedTocEntry[];
  expanded: Record<number, boolean>;
  isEditMode: boolean;
  onClick?: (entry: ProcessedTocEntry) => void;
  onIndentationChange?: (index: number, newIndentation: number) => void;
  onDelete?: (index: number) => void;
  onLabelChange?: (index: number, newLabel: string) => void;
  toggleExpand: (index: number) => void;
};

export const ToCItem = ({
  item,
  normalizedToc,
  expanded,
  isEditMode,
  onClick,
  onIndentationChange,
  onDelete,
  onLabelChange,
  toggleExpand,
}: ToCItemProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(item.entry.label?.trim() || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedLabel(item.entry.label?.trim() || '');
  }, [item.entry.label]);

  useEffect(() => {
    if (isEditingLabel && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingLabel]);

  const pageNumber = getPageNumber(item.entry);
  const label = item.entry.label?.trim() || `Section ${item.index + 1}`;
  const paddingLeft = item.isTopLevel ? 8 : item.indentation * 16 + 16;
  const isInteractive = typeof pageNumber === 'number' && !isEditMode;
  const ancestors = findAllAncestors(item, normalizedToc);
  // In edit mode, always show all items regardless of expansion state
  const shouldHide =
    !isEditMode &&
    ancestors.length > 0 &&
    ancestors.some(ancestor => (expanded[ancestor.index] ?? false) === false);
  if (shouldHide) {
    return null;
  }
  const hasChildren = hasDirectChildren(item, normalizedToc);
  const isExpanded = expanded[item.index] ?? false;

  const handleEntryClick = () => {
    if (!isEditMode) {
      onClick?.(item);
    }
  };

  const interactiveProps = getInteractiveProps(isInteractive, handleEntryClick);
  const topLevelClasses = item.isTopLevel
    ? 'bg-gray-100 shadow-sm hover:bg-gray-200'
    : 'hover:bg-gray-50';
  const baseClasses = `flex items-center justify-between gap-4 py-1.5 pr-2 transition ${
    isInteractive ? 'cursor-pointer' : ''
  } focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-inset rounded`;

  // Edit mode controls
  const editControls = {
    canDecreaseIndentation: item.indentation > 0,
    canIncreaseIndentation: item.indentation < 2,
    isFirstEntry: item.index === 0,
    handleDecreaseIndentation: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.indentation > 0 && onIndentationChange) {
        onIndentationChange(item.originalIndex, item.indentation - 1);
      }
    },
    handleIncreaseIndentation: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.indentation < 2 && onIndentationChange) {
        onIndentationChange(item.originalIndex, item.indentation + 1);
      }
    },
    handleDelete: () => {
      if (onDelete) {
        onDelete(item.originalIndex);
      }
    },
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    if (isEditMode && !isEditingLabel) {
      e.stopPropagation();
      setIsEditingLabel(true);
      setEditedLabel(item.entry.label?.trim() || '');
    }
  };

  const handleLabelSave = () => {
    if (onLabelChange) {
      onLabelChange(item.originalIndex, editedLabel.trim() || label);
    }
    setIsEditingLabel(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLabelSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditedLabel(item.entry.label?.trim() || '');
      setIsEditingLabel(false);
    }
  };

  const renderLabel = () => {
    if (isEditMode && isEditingLabel) {
      return (
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={editedLabel}
            onChange={e => setEditedLabel(e.target.value)}
            onKeyDown={handleLabelKeyDown}
            onClick={e => e.stopPropagation()}
            className="flex-1 text-sm font-semibold text-gray-900 px-2 h-5 leading-5 pt-0 pb-0 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
          />
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleLabelSave();
            }}
            className="rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-400 transition cursor-pointer flex-shrink-0"
            aria-label="Save label"
          >
            <CheckIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      );
    }
    if (isEditMode) {
      return (
        <div
          className="text-sm font-semibold text-gray-900 truncate cursor-text"
          onClick={handleLabelClick}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsEditingLabel(true);
              setEditedLabel(item.entry.label?.trim() || '');
            }
          }}
          role="button"
          tabIndex={0}
        >
          {label}
        </div>
      );
    }
    return <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>;
  };

  return (
    <div
      key={`toc-${item.index}`}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...interactiveProps}
      className={`${baseClasses} ${topLevelClasses}`}
      style={{ paddingLeft }}
    >
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {isEditMode
          ? renderEditControls({
              isEditMode,
              isFirstEntry: editControls.isFirstEntry,
              canDecreaseIndentation: editControls.canDecreaseIndentation,
              canIncreaseIndentation: editControls.canIncreaseIndentation,
              handleDecreaseIndentation: editControls.handleDecreaseIndentation,
              handleIncreaseIndentation: editControls.handleIncreaseIndentation,
            })
          : renderExpandButton({
              hasChildren,
              isEditMode,
              isExpanded,
              toggleExpand,
              itemIndex: item.index,
            })}
        {renderLabel()}
      </div>
      {renderRightSideContent({ pageNumber, isEditMode, handleDelete: editControls.handleDelete })}
    </div>
  );
};
