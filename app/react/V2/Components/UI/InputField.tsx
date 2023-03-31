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
  const buttonStyles = hasClearFieldButton ? 'pr-12' : '';

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
          className={`${textColor} ${buttonStyles} border rounded-lg bg-gray-50 border-gray-300 block flex-1 w-full text-sm p-2.5`}
          placeholder={placeholder}
        />
        {hasClearFieldButton && (
          <button
            type="button"
            onClick={buttonAction}
            disabled={disabled}
            className={`${textColor} border-l absolute top-px right-0 p-2.5 text-sm font-medium rounded-r-lg border-gray-300
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
          </button>
        )}
      </div>
    </div>
  );
};

export { InputField };
