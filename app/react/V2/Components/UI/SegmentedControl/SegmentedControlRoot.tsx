import React, { type KeyboardEvent, type ReactNode } from 'react';
import { segmentRootClass } from './segmentedControlStyles.js';
import { SegmentedControlContext } from './SegmentedControlContext.js';

type SegmentedControlRootProps = {
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

const focusSegment = (container: HTMLDivElement, index: number) => {
  const items = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="radio"]:not([disabled])'),
  ];
  const item = items[index];
  if (item) item.focus();
};

const handleKeyDown = (
  event: KeyboardEvent<HTMLDivElement>,
  value: string | undefined,
  onValueChange: ((next: string) => void) | undefined,
  disabled: boolean
) => {
  if (disabled || !onValueChange) return;

  const items = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not([disabled])'),
  ];
  if (items.length === 0) return;

  const focusedIndex = items.findIndex(item => item === document.activeElement);
  const selectedIndex = items.findIndex(item => item.dataset.value === value);
  const index = focusedIndex >= 0 ? focusedIndex : Math.max(selectedIndex, 0);

  let nextIndex: number | null = null;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = (index + 1) % items.length;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = (index - 1 + items.length) % items.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = items.length - 1;
  }

  if (nextIndex === null) return;

  event.preventDefault();
  const next = items[nextIndex];
  const nextValue = next.dataset.value;
  if (!nextValue) return;

  onValueChange(nextValue);
  focusSegment(event.currentTarget, nextIndex);
};

const SegmentedControlRoot = ({
  ariaLabel,
  children,
  disabled = false,
  className = '',
  value,
  onValueChange,
}: SegmentedControlRootProps) => {
  const contextValue =
    value !== undefined && onValueChange ? { value, onValueChange, disabled } : null;

  return (
    <SegmentedControlContext.Provider value={contextValue}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-disabled={disabled}
        className={segmentRootClass(disabled, className)}
        onKeyDown={event => handleKeyDown(event, value, onValueChange, disabled)}
      >
        {children}
      </div>
    </SegmentedControlContext.Provider>
  );
};

export type { SegmentedControlRootProps };
export { SegmentedControlRoot };
