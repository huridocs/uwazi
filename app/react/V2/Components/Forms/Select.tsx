import React, { ChangeEventHandler, CSSProperties } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Label } from './Label.js';

type OptionSchema = {
  key?: string;
  value: string;
  label?: string | React.ReactNode;
  disabled?: boolean;
};
interface SelectProps {
  id: string;
  label: string | React.ReactNode;
  options: OptionSchema[];
  value?: string;
  disabled?: boolean;
  hideLabel?: boolean;
  hasErrors?: boolean;
  className?: string;
  name?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  onBlur?: ChangeEventHandler<HTMLSelectElement>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      options,
      value,
      disabled,
      hideLabel,
      hasErrors,
      className,
      name = '',
      onChange = () => {},
      onBlur = () => {},
    },
    ref
  ) => {
    const showError = Boolean(hasErrors);
    let backgroundColor = 'var(--color-theme-control-bg)';
    let textColor = 'var(--color-theme-control-text)';

    if (disabled) {
      backgroundColor = 'var(--color-theme-control-bg-disabled)';
      textColor = 'var(--color-theme-control-text-disabled)';
    } else if (showError) {
      backgroundColor = 'var(--color-theme-control-bg-error)';
      textColor = 'var(--color-theme-control-text-error)';
    }

    const fieldStyle: CSSProperties = {
      borderColor: showError
        ? 'var(--color-theme-control-border-error)'
        : 'var(--color-theme-control-border)',
      backgroundColor,
      color: textColor,
    };

    return (
      <div className={className}>
        <div className="relative w-full">
          <Label htmlFor={id} hideLabel={hideLabel} hasErrors={Boolean(hasErrors)}>
            {label}
          </Label>
          <select
            className={`block w-full appearance-none rounded-lg border p-2.5 pr-10 text-sm focus:outline-hidden ${
              showError
                ? 'focus:border-(--color-theme-control-border-error) focus:[box-shadow:0_0_0_4px_var(--color-theme-control-error-ring)]'
                : 'focus:border-(--color-theme-control-border-focus) focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]'
            }`}
            id={id}
            disabled={disabled}
            ref={ref}
            name={name}
            onBlur={onBlur}
            onChange={onChange}
            value={value}
            style={fieldStyle}
          >
            {options.map(({ key, value: optionValue, label: optionLabel, disabled: optionDisabled }) => (
              <option key={key || optionValue} value={optionValue} disabled={optionDisabled}>
                {optionLabel || optionValue}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute bottom-1 right-3 transform -translate-y-2 flex items-center">
            <ChevronDownIcon className="h-4 w-4 text-(--color-theme-control-text-muted)" />
          </div>
        </div>
      </div>
    );
  }
);

export type { SelectProps, OptionSchema };
export { Select };
