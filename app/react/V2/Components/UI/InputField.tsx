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
  value?: string;
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
  value,
  clearFieldAction,
}: InputFieldProps) => {
  const hasClearFieldButton = Boolean(clearFieldAction);
  let fieldStyles = 'border-gray-300 border text-gray-900';
  let clearFieldStyles = 'enabled:hover:text-primary-700 text-gray-900';

  if (hasErrors) {
    fieldStyles =
      'border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-red-900';
    clearFieldStyles = 'enabled:hover:text-error-700 text-error-900';
  }

  if (hasClearFieldButton) {
    fieldStyles = `${fieldStyles} pr-10`;
  }

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
          value={value}
          className={`${fieldStyles} disabled:text-gray-500 rounded-lg bg-gray-50 block flex-1 w-full text-sm p-2.5`}
          placeholder={placeholder}
        />
        {hasClearFieldButton && (
          <button
            type="button"
            onClick={clearFieldAction}
            disabled={disabled}
            className={`${clearFieldStyles} top-px disabled:text-gray-500 absolute p-2.5 right-0 text-sm font-medium rounded-r-lg
             focus:outline-none`}
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
