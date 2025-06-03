import React, { RefObject } from 'react';
import { CalendarDateRangeIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';

type DateRangeInputProps = {
  id: string;
  model?: string;
  value: string | number | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: RefObject<HTMLInputElement>;
  disabled?: boolean;
  inputClassName?: string;
  hasErrors?: boolean;
  errorMessage?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  showCalendarIcon?: boolean;
  showClearFieldIcon?: boolean;
  onClear?: () => void;
  horizontal?: boolean;
  label?: string;
  language?: string;
};

export const DateRangeInput: React.FC<DateRangeInputProps> = ({
  id,
  model,
  value,
  onChange,
  onBlur,
  onKeyDown,
  inputRef,
  disabled,
  inputClassName,
  hasErrors,
  errorMessage,
  placeholder,
  autoComplete = 'off',
  required,
  showCalendarIcon = true,
  showClearFieldIcon = true,
  onClear,
  horizontal,
  label,
  language = 'en',
}) => {
  return (
    <div className={`relative ${horizontal ? 'w-1/2' : 'w-full'} text-gray-600 DatePicker__${id}`}>
      {showCalendarIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex gap-1 z-10">
          <CalendarDateRangeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          {label && <Translate translationKey={`Label date "${label}"`}>{label}</Translate>}
        </div>
      )}

      <input
        id={id}
        name={model || 'dateField'}
        data-datepicker={true}
        data-datepicker-autohide={true}
        data-datepicker-buttons={true}
        data-datepicker-autoselect-today={true}
        type="text"
        defaultValue={value || ''}
        onChange={onChange}
        onSelect={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        ref={inputRef}
        disabled={disabled}
        className={`
          form-control datepicker-input block w-full text-sm h-8 rounded-lg pl-[80px] pr-8
          placeholder-opacity-100 placeholder-gray-500
          ${inputClassName || ''}
          ${
            hasErrors || errorMessage
              ? 'border-2 !border-red-300 text-red-900 bg-red-50 hover:border-red-400 focus:!border-form-error-border focus:outline-none focus:!shadow-form-error focus:!ring-0'
              : 'bg-gray-50 border border-gray-300 text-gray-900 hover:border-gray-400 focus:!border-[#66afe9] focus:outline-none focus:!shadow-form-focus focus:!ring-0'
          }
        `}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        lang={language}
      />

      {Boolean(value) && showClearFieldIcon && (
        <button
          type="button"
          data-testid="clear-field-button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-20"
          onClick={onClear}
          aria-label="Clear date"
        >
          <XCircleIcon className="w-5 h-5 text-gray-200 dark:text-gray-400 hover:text-red-200" />
        </button>
      )}
    </div>
  );
};
