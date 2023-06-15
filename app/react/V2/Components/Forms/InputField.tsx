import React, { ChangeEventHandler, Ref } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';
import { isString } from 'lodash';

interface InputFieldProps {
  id: string;
  label: string | React.ReactNode;
  disabled?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  hasErrors?: boolean;
  errorMessage?: string | React.ReactNode;
  value?: string;
  className?: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: 'on' | 'off';
  name?: string;
  clearFieldAction?: () => any;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: ChangeEventHandler<HTMLInputElement>;
}

const renderChild = (child: string | React.ReactNode) =>
  isString(child) ? <Translate>{child}</Translate> : child;

const InputField = React.forwardRef(
  (
    {
      id,
      label,
      disabled = false,
      hideLabel = false,
      placeholder = '',
      hasErrors = false,
      errorMessage = '',
      value = '',
      className = '',
      type = 'text',
      autoComplete = 'on',
      name = '',
      clearFieldAction,
      onChange = () => {},
      onBlur = () => {},
    }: InputFieldProps,
    ref: Ref<any>
  ) => {
    let fieldStyles = 'border-gray-300 border text-gray-900 focus:ring-primary-500';
    let clearFieldStyles = 'enabled:hover:text-primary-700 text-gray-900';
    let labelStyles = hideLabel ? 'sr-only' : 'block mb-2 text-sm font-medium text-gray-700';

    if (hasErrors || errorMessage) {
      fieldStyles =
        'border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700';
      clearFieldStyles = 'enabled:hover:text-error-700 text-error-900';
      labelStyles = `${labelStyles} text-error-700`;
    }

    if (clearFieldAction) {
      fieldStyles = `${fieldStyles} pr-10`;
    }

    return (
      <div className={className}>
        <label htmlFor={id} className={labelStyles}>
          {renderChild(label)}
        </label>
        <div className="relative w-full">
          <input
            type={type}
            autoComplete={autoComplete}
            id={id}
            onChange={onChange}
            onBlur={onBlur}
            name={name}
            ref={ref}
            disabled={disabled}
            value={value}
            className={`${fieldStyles} disabled:text-gray-500 rounded-lg bg-gray-50 block flex-1 w-full text-sm p-2.5`}
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
          {errorMessage && (
            <p className="mt-2 text-sm text-error-600">{renderChild(errorMessage)}</p>
          )}
        </div>
      </div>
    );
  }
);

export { InputField };
