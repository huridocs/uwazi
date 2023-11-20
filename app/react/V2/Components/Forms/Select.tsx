import React, { ChangeEventHandler, Ref } from 'react';

interface SelectProps {
  id: string;
  label: string | React.ReactNode;
  options: { key: string; value: string; selected?: boolean }[];
  disabled?: boolean;
  hideLabel?: boolean;
  hasErrors?: boolean;
  className?: string;
  name?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  onBlur?: ChangeEventHandler<HTMLSelectElement>;
}

const Select = React.forwardRef(
  (
    {
      id,
      label,
      options,
      disabled,
      hideLabel,
      hasErrors,
      className,
      name = '',
      onChange = () => {},
      onBlur = () => {},
    }: SelectProps,
    ref: Ref<any>
  ) => {
    const fieldStyles = hasErrors
      ? 'border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900'
      : 'border-gray-300 border text-gray-900';

    return (
      <div className={className}>
        <div className="relative w-full">
          <label htmlFor={id} className={hideLabel ? 'sr-only' : ''}>
            {label}
          </label>
          <select
            className={`${fieldStyles} disabled:text-gray-500 rounded-lg bg-gray-50 block flex-1 w-full text-sm p-2.5`}
            id={id}
            disabled={disabled}
            ref={ref}
            name={name}
            onBlur={onBlur}
            onChange={onChange}
          >
            {options.map(({ key, value, selected }) => (
              <option key={key} value={value} selected={selected}>
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
