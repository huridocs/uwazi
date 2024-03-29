import React, { ChangeEventHandler, Ref } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';
import { InputError } from './InputError';
import { Label } from './Label';

interface InputFieldProps {
  id: string;
  label?: string | React.ReactNode;
  disabled?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  hasErrors?: boolean;
  errorMessage?: string | React.ReactNode;
  value?: string | number;
  className?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'search' | 'file';
  autoComplete?: 'on' | 'off';
  preText?: string | React.ReactNode;
  name?: string;
  clearFieldAction?: () => any;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onSelect?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: ChangeEventHandler<HTMLInputElement>;
}

const InputField = React.forwardRef(
  (
    {
      id,
      label,
      disabled,
      hideLabel,
      placeholder,
      hasErrors,
      errorMessage,
      value,
      className = '',
      preText,
      type = 'text',
      autoComplete = 'on',
      name = '',
      clearFieldAction,
      onChange = () => {},
      onSelect = () => {},
      onBlur = () => {},
    }: InputFieldProps,
    ref: Ref<any>
  ) => {
    let fieldStyles = 'border-gray-300 border text-gray-900 focus:ring-primary-500 bg-gray-50';
    let clearFieldStyles = 'enabled:hover:text-primary-700 text-gray-900';

    if (hasErrors || errorMessage) {
      fieldStyles =
        'border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700';
      clearFieldStyles = 'enabled:hover:text-error-700 text-error-900';
    }

    if (clearFieldAction) {
      fieldStyles = `${fieldStyles} pr-10`;
    }

    return (
      <div className={className}>
        <Label
          htmlFor={id}
          hideLabel={!label || hideLabel}
          hasErrors={Boolean(hasErrors || errorMessage)}
        >
          {label}
        </Label>
        <div className="relative flex w-full">
          {preText && (
            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-e-0 rounded-s-md">
              {preText}
            </span>
          )}
          <input
            type={type}
            autoComplete={autoComplete}
            id={id}
            onSelect={onSelect}
            onChange={onChange}
            onBlur={onBlur}
            name={name}
            ref={ref}
            disabled={disabled}
            value={value}
            className={`${fieldStyles} disabled:text-gray-500 block flex-1 w-full text-sm ${
              type !== 'file' ? 'p-2.5' : ''
            } ${preText ? 'rounded-none rounded-e-lg' : 'rounded-lg'}`}
            placeholder={placeholder}
          />
          {Boolean(clearFieldAction) && (
            <button
              type="button"
              onClick={clearFieldAction}
              disabled={disabled}
              data-testid="clear-field-button"
              className={`${clearFieldStyles} top-px disabled:text-gray-500 absolute p-2.5 right-0 text-sm font-medium rounded-r-lg
             focus:outline-none`}
            >
              <XMarkIcon className="w-5" />
              <Translate className="sr-only">Clear</Translate>
            </button>
          )}
        </div>
        {errorMessage && <InputError>{errorMessage}</InputError>}
      </div>
    );
  }
);

export { InputField };
