import React, { type ComponentType, type ReactNode, type SVGProps } from 'react';

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
};

const segmentClass = (active: boolean, disabled: boolean, hasBorder: boolean): string => {
  const parts = [
    'flex h-6 items-center justify-center gap-1 px-2 text-[11px] font-medium transition-colors',
  ];
  if (disabled) parts.push('cursor-not-allowed text-ink-muted');
  else if (active) parts.push('cursor-pointer bg-vellum text-ink');
  else parts.push('cursor-pointer text-ink-tertiary hover:bg-warm hover:text-ink-secondary');
  if (hasBorder) parts.push('border-l border-border');
  return parts.join(' ');
};

const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  showLabels = false,
}: SegmentedControlProps<T>) => (
  <div
    role="group"
    aria-label={ariaLabel}
    aria-disabled={disabled}
    className={`flex h-6 items-center overflow-hidden rounded-md border border-border ${
      disabled ? 'opacity-60' : ''
    }`}
  >
    {options.map((option, index) => {
      const active = value === option.id;
      const { Icon } = option;
      return (
        <button
          key={option.id}
          type="button"
          aria-pressed={active}
          aria-label={option.title ?? (typeof option.label === 'string' ? option.label : option.id)}
          title={option.title}
          disabled={disabled}
          onClick={() => !disabled && onChange(option.id)}
          className={segmentClass(active, disabled, index > 0)}
        >
          {Icon && <Icon className="h-3 w-3" aria-hidden />}
          {showLabels && option.label && <span className="hidden sm:inline">{option.label}</span>}
        </button>
      );
    })}
  </div>
);

export type { SegmentedOption };
export { SegmentedControl };
