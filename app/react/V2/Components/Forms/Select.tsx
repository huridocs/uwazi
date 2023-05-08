import React, { Ref } from 'react';

interface SelectProps {
  id: string;
  label: string | React.ReactNode;
  options: { key: string; value: string }[];
  disabled?: boolean;
  hideLabel?: boolean;
  hasErrors?: boolean;
  className?: string;
  name?: string;
}

const Select = React.forwardRef(
  (
    { id, label, options, disabled, hideLabel, hasErrors, className, name = '' }: SelectProps,
    ref: Ref<any>
  ) => {
    let fieldStyles = 'border-gray-300 border text-gray-900';
    let clearFieldStyles = 'enabled:hover:text-primary-700 text-gray-900';

    if (hasErrors) {
      fieldStyles =
        'border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-red-900';
    }

    return (
      <div className={className}>
        <div className="relative w-full">
          <label htmlFor={id} className={hideLabel ? 'sr-only' : ''}>
            {label}
          </label>
          <select
            id={id}
            name={name}
            ref={ref}
            disabled={disabled}
            className={`${fieldStyles} disabled:text-gray-500 rounded-lg bg-gray-50 block flex-1 w-full text-sm p-2.5`}
          >
            {options.map(({ key, value }) => (
              <option key={key} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
);

export { Select };
