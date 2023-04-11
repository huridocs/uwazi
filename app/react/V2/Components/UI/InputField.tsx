import { Translate } from 'app/I18N';
import React, { ChangeEventHandler, Ref } from 'react';

interface InputFieldProps {
  fieldID: string;
  label: string | React.ReactNode;
  inputControls?: {
    onChange?: ChangeEventHandler;
    onBlur?: ChangeEventHandler;
    name?: string;
    ref?: Ref<any>;
  };
  disabled?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  hasErrors?: boolean;
  clearFieldAction?: () => any;
}

const InputField = ({
  fieldID,
  label,
  inputControls,
  disabled,
  hideLabel,
  placeholder,
  hasErrors,
  clearFieldAction,
}: InputFieldProps) => {
  const hasClearFieldButton = Boolean(clearFieldAction);
  const textColor = disabled ? 'text-gray-500' : 'text-gray-900';
  const buttonStyles = hasClearFieldButton ? 'pr-12' : '';
  const fieldBorderStyles = hasErrors ? 'border-error-300 border-2' : 'border-gray-300 border';
  const clearFieldBorderStyles = hasErrors
    ? 'border-red-300 border-l-2 top-0.5'
    : 'border-gray-300 border-l top-px';

  const { onChange, onBlur, name, ref } = inputControls || {
    onChange: () => {},
    onBlur: () => {},
    name: '',
    ref: undefined,
  };

  return (
    <div>
      <label htmlFor={fieldID} className={hideLabel ? 'sr-only' : ''}>
        {label}
      </label>
      <div className="relative w-full">
        <input
          type="text"
          id={fieldID}
          onChange={onChange}
          onBlur={onBlur}
          name={name}
          ref={ref}
          disabled={disabled}
          className={`${textColor} ${buttonStyles} ${fieldBorderStyles} rounded-lg bg-gray-50 block flex-1 w-full text-sm p-2.5`}
          placeholder={placeholder}
        />
        {hasClearFieldButton && (
          <button
            type="button"
            onClick={clearFieldAction}
            disabled={disabled}
            className={`${textColor} ${clearFieldBorderStyles} absolute p-2.5 right-0 text-sm font-medium rounded-r-lg
            hover:text-primary-700 focus:outline-none`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <Translate className="sr-only">Clear</Translate>
          </button>
        )}
      </div>
    </div>
  );
};

export { InputField };
