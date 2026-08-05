/* eslint-disable max-lines */
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { PageTag } from '../relationships/rows/PageTag.js';
import type { ProcessedTocEntry } from './types.js';
import { DeleteConfirmation } from './DeleteConfirmation.js';
import { findAllAncestors, getPageNumber, hasDirectChildren } from './utils.js';

type EditControlsProps = {
  isFirstEntry: boolean;
  canDecreaseIndentation: boolean;
  canIncreaseIndentation: boolean;
  handleDecreaseIndentation: (e: React.MouseEvent) => void;
  handleIncreaseIndentation: (e: React.MouseEvent) => void;
};

const EditControls = ({
  isFirstEntry,
  canDecreaseIndentation,
  canIncreaseIndentation,
  handleDecreaseIndentation,
  handleIncreaseIndentation,
}: EditControlsProps) => (
  <div className="flex shrink-0 items-center gap-0.5">
    <button
      type="button"
      onClick={handleDecreaseIndentation}
      disabled={isFirstEntry || !canDecreaseIndentation}
      className="h-5 w-5 cursor-pointer rounded transition hover:bg-warm focus:outline-none focus:ring-1 focus:ring-carbon/30 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Decrease indentation"
    >
      <ChevronLeftIcon className="h-4 w-4 text-ink-secondary" />
    </button>
    <button
      type="button"
      onClick={handleIncreaseIndentation}
      disabled={isFirstEntry || !canIncreaseIndentation}
      className="h-5 w-5 cursor-pointer rounded transition hover:bg-warm focus:outline-none focus:ring-1 focus:ring-carbon/30 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Increase indentation"
    >
      <ChevronRightIcon className="h-4 w-4 text-ink-secondary" />
    </button>
  </div>
);

export type ToCItemProps = {
  item: ProcessedTocEntry;
  normalizedToc: ProcessedTocEntry[];
  expanded: Record<number, boolean>;
  isEditMode: boolean;
  isActive?: boolean;
  isOnActivePath?: boolean;
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
  isActive = false,
  isOnActivePath = false,
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
  const indent = item.indentation * 16;
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

  const handleJump = () => {
    if (!isEditMode && pageNumber !== null) {
      onClick?.(item);
    }
  };

  const handleRowClick = () => {
    if (isEditMode) {
      return;
    }
    if (hasChildren) {
      toggleExpand(item.index);
    }
    handleJump();
  };

  const handleRowKeyDown = (event: React.KeyboardEvent) => {
    if (isEditMode) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowClick();
    }
  };

  const canDecreaseIndentation = item.indentation > 0;
  const canIncreaseIndentation = item.indentation < 2;
  const isFirstEntry = item.index === 0;

  const handleDecreaseIndentation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.indentation > 0 && onIndentationChange) {
      onIndentationChange(item.originalIndex, item.indentation - 1);
    }
  };

  const handleIncreaseIndentation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.indentation < 2 && onIndentationChange) {
      onIndentationChange(item.originalIndex, item.indentation + 1);
    }
  };

  const handleDelete = () => {
    onDelete?.(item.originalIndex);
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    if (isEditMode && !isEditingLabel) {
      e.stopPropagation();
      setIsEditingLabel(true);
      setEditedLabel(item.entry.label?.trim() || '');
    }
  };

  const handleLabelSave = () => {
    onLabelChange?.(item.originalIndex, editedLabel.trim() || label);
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

  let labelTone = 'font-medium text-ink-secondary';
  if (item.indentation === 0) {
    labelTone = 'font-bold uppercase text-ink';
  } else if (isActive) {
    labelTone = 'font-semibold text-ink';
  }
  const labelClassName = `flex-1 truncate text-xs leading-relaxed ${labelTone}`;

  let rowTone = 'hover:bg-warm';
  if (isActive) {
    rowTone = 'bg-parchment';
  } else if (isOnActivePath) {
    rowTone = 'bg-warm/50';
  }
  const rowClassName = `group flex w-full items-center gap-2 rounded px-2 py-2 text-left transition-colors ${
    isEditMode ? '' : 'cursor-pointer'
  } ${rowTone}`;

  let expandLabel: string | undefined;
  if (hasChildren) {
    expandLabel = isExpanded ? 'Collapse section' : 'Expand section';
  }

  const renderLabel = () => {
    if (isEditMode && isEditingLabel) {
      return (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={editedLabel}
            onChange={e => setEditedLabel(e.target.value)}
            onKeyDown={handleLabelKeyDown}
            onClick={e => e.stopPropagation()}
            className="h-5 flex-1 rounded border border-border-soft bg-paper px-2 py-0 text-sm font-semibold leading-5 text-ink focus:outline-none focus:ring-2 focus:ring-carbon/30"
          />
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleLabelSave();
            }}
            className="shrink-0 cursor-pointer rounded transition hover:bg-warm focus:outline-none focus:ring-1 focus:ring-carbon/30"
            aria-label="Save label"
          >
            <CheckIcon className="h-4 w-4 text-ink-secondary" />
          </button>
        </div>
      );
    }

    if (isEditMode) {
      return (
        <div
          className={`${labelClassName} cursor-text`}
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

    return <span className={labelClassName}>{label}</span>;
  };

  const chevronOrEdit = isEditMode ? (
    <EditControls
      isFirstEntry={isFirstEntry}
      canDecreaseIndentation={canDecreaseIndentation}
      canIncreaseIndentation={canIncreaseIndentation}
      handleDecreaseIndentation={handleDecreaseIndentation}
      handleIncreaseIndentation={handleIncreaseIndentation}
    />
  ) : (
    <span className="flex w-3.5 shrink-0 items-center justify-center">
      {hasChildren ? (
        <ChevronDownIcon
          className={`h-3 w-3 text-ink-tertiary transition-transform ${
            isExpanded ? '' : '-rotate-90'
          }`}
          aria-hidden
        />
      ) : null}
    </span>
  );

  const rightSide = isEditMode ? (
    <DeleteConfirmation
      onConfirm={handleDelete}
      triggerButton={
        <button
          type="button"
          className="h-5 w-5 cursor-pointer rounded transition hover:bg-seal-tint focus:outline-none focus:ring-1 focus:ring-(--color-theme-feedback-danger)"
          aria-label="Delete entry"
        >
          <TrashIcon className="h-4 w-4 text-seal" />
        </button>
      }
    />
  ) : (
    typeof pageNumber === 'number' && <PageTag page={pageNumber} onClick={handleJump} />
  );

  const interactiveProps = isEditMode
    ? {}
    : {
        role: 'button' as const,
        tabIndex: 0,
        onClick: handleRowClick,
        onKeyDown: handleRowKeyDown,
        'aria-current': isActive ? ('true' as const) : undefined,
        'aria-expanded': hasChildren ? isExpanded : undefined,
        'aria-label': expandLabel,
      };

  return (
    <div className={rowClassName} style={{ paddingLeft: 8 + indent }} {...interactiveProps}>
      {chevronOrEdit}
      {renderLabel()}
      {rightSide}
    </div>
  );
};
