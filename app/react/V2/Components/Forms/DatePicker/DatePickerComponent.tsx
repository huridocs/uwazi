/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useRef } from 'react';

//Module has no types
//@ts-ignore
import { Datepicker } from 'flowbite-datepicker';
import 'flowbite/dist/flowbite.min.css';
import { CalendarIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { useAtomValue } from 'jotai';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom } from 'app/V2/atoms';
import { Translate } from 'app/I18N';
import { debounce } from 'app/utils';
import uniqueID from 'shared/uniqueID';
import { Label } from '../Label';
import { InputError } from '../InputError';
import { datePickerOptionsByLocale, validateLocale, handleKeyDown } from './dateUtils';
import { DatePickerProps } from './types';

const DatePickerComponent = ({
  id = uniqueID(),
  name = 'date',
  value = '',
  autoComplete = 'off',
  language = 'en',
  dateFormat = 'YYYY-MM-DD',
  hideLabel = false,
  inputClassName = '',
  className = '',
  labelToday = 'Today',
  labelClear = 'Clear',
  label,
  disabled = false,
  placeholder,
  hasErrors = false,
  errorMessage,
  onChange = () => { },
  onBlur = () => { },
  showCalendarIcon = true,
  showClearFieldIcon = true,
  required = false,
  inputRef: externalInputRef,
  innerLabel,
}: DatePickerProps) => {
  const { dateFormat: defaultDateFormat = 'DD/MM/YYYY' } =
    useAtomValue<ClientSettings>(settingsAtom);
  const datePickerFormat = (dateFormat || defaultDateFormat).toLowerCase();
  const divRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const instance = useRef<Datepicker | null>(null);
  const locale = validateLocale(language);
  const inputRef = externalInputRef || internalInputRef;

  useEffect((): (() => void) => {
    Object.assign(Datepicker.locales, {
      [locale]: datePickerOptionsByLocale(locale, labelToday, labelClear, datePickerFormat),
    });
    instance.current = new Datepicker(inputRef.current, {
      container: '#tw-container',
      language: locale,
      labelToday,
      labelClear,
      locales: { [locale]: Datepicker.locales[locale] },
      todayBtnMode: 1,
      todayBtn: true,
      clearBtn: true,
      autohide: true,
      format: datePickerFormat,
    });
    return () => (instance?.current?.hide instanceof Function ? instance?.current?.hide() : {});
  }, []);

  const debouncedOnChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue !== value && (newValue === '' || newValue.length === 10)) {
      onChange(e);
    }
  }, 300);

  const debouncedOnBlur = debounce((e: React.FocusEvent<HTMLInputElement>) => {
    onBlur(e);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (inputRef?.current) {
      inputRef.current.value = newValue;
    }
    debouncedOnChange(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    debouncedOnBlur(e);
  };

  const clearValue = () => {
    instance.current?.setDate({ clear: true });
    handleChange({
      target: {
        value: '',
      },
    } as any);
  };

  return (
    <div className="tw-content">
      <div
        id="tw-container"
        className={`${className} tw-datepicker z-50 w-full p-0`}
        data-test-id={id}
      />
      <div>
        {label !== undefined && (
          <Label htmlFor={id} hideLabel={hideLabel} hasErrors={Boolean(hasErrors || errorMessage)}>
            {label}
          </Label>
        )}
        <div
          ref={divRef}
          id={id}
          data-datepicker="true"
          data-datepicker-buttons="true"
          data-datepicker-autoselect-today="true"
          className="relative text-gray-600 react-datepicker-wrapper"
        >
          {showCalendarIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              {innerLabel && <Translate translationKey={innerLabel}></Translate>}
            </div>
          )}
          <input
            id={id}
            name={name}
            data-datepicker={true}
            data-datepicker-autohide={true}
            data-datepicker-buttons={true}
            data-datepicker-autoselect-today={true}
            type="text"
            lang={locale}
            defaultValue={value || ''}
            onChange={handleChange}
            onSelect={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            disabled={disabled}
            className={`
  form-control datepicker-input block w-full text-sm h-8 rounded-lg pl-10 pr-8
  placeholder-opacity-100 placeholder-gray-500
  ${innerLabel ? 'pl-[80px]' : 'pl-10'}
  ${inputClassName || ''}
  ${hasErrors || errorMessage
                ? 'border-2 !border-red-300 text-red-900 bg-red-50 hover:border-red-400 focus:!border-form-error-border focus:outline-none focus:!shadow-form-error focus:!ring-0'
                : 'bg-gray-50 border border-gray-300 text-gray-900 hover:border-gray-400 focus:!border-[#66afe9] focus:outline-none focus:!shadow-form-focus focus:!ring-0'
              }
`}
            placeholder={placeholder || dateFormat}
            autoComplete={autoComplete}
            required={required}
          />

          {Boolean(value) && showClearFieldIcon && (
            <button
              type="button"
              data-testid="clear-field-button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-10"
              onClick={clearValue}
            >
              <XCircleIcon className="w-5 h-5 text-gray-200 dark:text-gray-400 hover:text-red-200" />
            </button>
          )}
        </div>
        {errorMessage && <InputError>{errorMessage}</InputError>}
      </div>
    </div>
  );
};

export { DatePickerComponent, datePickerOptionsByLocale, validateLocale };
