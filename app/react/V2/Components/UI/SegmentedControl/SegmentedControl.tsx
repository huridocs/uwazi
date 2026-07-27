import React, { type ComponentType, type ReactNode, type SVGProps } from 'react';
import { SegmentedControlItem } from './SegmentedControlItem.js';
import { SegmentedControlRoot } from './SegmentedControlRoot.js';

type SegmentedOption<T extends string> = {
  id: T;
  label?: ReactNode;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title?: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (id: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  showLabels?: boolean;
  className?: string;
  size?: 'sm' | 'md';
};

const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  showLabels = false,
  className = '',
  size = 'sm',
}: SegmentedControlProps<T>) => (
  <SegmentedControlRoot
    ariaLabel={ariaLabel}
    disabled={disabled}
    className={className}
    value={value}
    onValueChange={next => onChange(next as T)}
    size={size}
  >
    {options.map(option => {
      const { Icon } = option;
      const ariaLabelOption =
        option.title ?? (typeof option.label === 'string' ? option.label : option.id);

      return (
        <SegmentedControlItem
          key={option.id}
          value={option.id}
          ariaLabel={ariaLabelOption}
          title={option.title}
        >
          {Icon && <Icon className="h-3 w-3" aria-hidden />}
          {showLabels && option.label && <span className="hidden sm:inline">{option.label}</span>}
        </SegmentedControlItem>
      );
    })}
  </SegmentedControlRoot>
);

export type { SegmentedOption, SegmentedControlProps };
export { SegmentedControl };
