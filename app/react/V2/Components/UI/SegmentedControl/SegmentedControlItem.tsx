import React, { type ReactNode } from 'react';
import { segmentItemClass } from './segmentedControlStyles.js';
import { useSegmentedControlContext } from './SegmentedControlContext.js';

type SegmentedControlItemProps = {
  value: string;
  ariaLabel: string;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onSelect?: () => void;
  className?: string;
};

const SegmentedControlItem = ({
  value,
  ariaLabel,
  children,
  active: activeProp,
  disabled: disabledProp = false,
  title,
  onSelect,
  className = '',
}: SegmentedControlItemProps) => {
  const context = useSegmentedControlContext();
  const active = context ? context.value === value : Boolean(activeProp);
  const disabled = disabledProp || context?.disabled || false;

  const select = () => {
    if (disabled) return;
    if (context) {
      context.onValueChange(value);
      return;
    }
    onSelect?.();
  };

  return (
    <button
      type="button"
      role="radio"
      data-value={value}
      aria-checked={active}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      onClick={select}
      className={segmentItemClass(active, disabled, className)}
    >
      {children}
    </button>
  );
};

export type { SegmentedControlItemProps };
export { SegmentedControlItem };
