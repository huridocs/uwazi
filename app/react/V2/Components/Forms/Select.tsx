import React, { ChangeEventHandler } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Label } from './Label';

type OptionSchema = { key?: string; value: string; label?: string | React.ReactNode };
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
    const fieldStyles = hasErrors
      ? 'border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900'
      : 'border-gray-300 border text-gray-900';

    return (
      <div className={className}>
        <div className="relative w-full">
          <Label htmlFor={id} hideLabel={hideLabel} hasErrors={Boolean(hasErrors)}>
            {label}
          </Label>
          <select
            className={`${fieldStyles} disabled:text-gray-500 rounded-lg bg-gray-50 block w-full text-sm p-2.5 pr-10 appearance-none`}
            id={id}
            disabled={disabled}
            ref={ref}
            name={name}
            onBlur={onBlur}
            onChange={onChange}
            value={value}
          >
            {options.map(({ key, value: optionValue, label: optionLabel }) => (
              <option key={key || optionValue} value={optionValue}>
                {optionLabel || optionValue}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute bottom-1 right-3 transform -translate-y-2 flex items-center">
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    );
  }
);

export type { SelectProps, OptionSchema };
export { Select };
