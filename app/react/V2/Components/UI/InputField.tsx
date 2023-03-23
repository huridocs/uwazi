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
  buttonAction?: () => any;
}

const InputField = ({
  fieldID,
  label,
  inputControls,
  disabled,
  hideLabel,
  placeholder,
  buttonAction,
}: InputFieldProps) => {
  const hasClearFieldButton = Boolean(buttonAction);
  const textColor = disabled ? 'text-gray-500' : 'text-gray-900';
  const inputBorderStyles = hasClearFieldButton
    ? 'border-y border-l border-r-0 rounded-l-lg rounded-none'
    : 'border rounded-lg';

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
      <div className="flex">
        <input
          type="text"
          id={fieldID}
          onChange={onChange}
          onBlur={onBlur}
          name={name}
          ref={ref}
          disabled={disabled}
          className={`${textColor} ${inputBorderStyles} bg-gray-50 border-gray-300 block flex-1 min-w-0 lg:w-full text-sm p-2.5`}
          placeholder={placeholder}
        />
        {hasClearFieldButton && (
          <button
            type="button"
            onClick={buttonAction}
            disabled={disabled}
            className={`${textColor} items-center px-3 text-sm bg-gray-50 border-y border-r border-l-0 border-gray-300 rounded-r-lg inline-flex`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-3 h-3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export { InputField };
