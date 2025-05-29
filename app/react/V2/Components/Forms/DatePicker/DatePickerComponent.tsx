import React, { useEffect, useRef } from 'react';

//Module has no types
//@ts-ignore
import { Datepicker } from 'flowbite-datepicker';
import 'flowbite/dist/flowbite.min.css';
import { CalendarIcon, XCircleIcon } from '@heroicons/react/20/solid';
import uniqueID from 'shared/uniqueID';
import { debounce } from 'app/utils';
import { Label } from '../Label';
import { InputError } from '../InputError';
import { datePickerOptionsByLocale, DatePickerProps, validateLocale } from './dateUtils';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom } from 'app/V2/atoms';
import { useAtomValue } from 'jotai';

const DatePickerComponent = ({
  labelToday = 'Today',
  labelClear = 'Clear',
  label = '',
  disabled = false,
  placeholder,
  hasErrors = false,
  errorMessage = '',
  value = '',
  autoComplete = 'off',
  id = uniqueID(),
  language = 'en',
  dateFormat,
  hideLabel = true,
  inputClassName = '',
  className = '',
  name = 'date',
  onChange = () => {},
  onBlur = () => {},
  clearFieldAction = () => {},
  showCalendarIcon = true,
  showClearFieldIcon = true,
  required = false,
}: DatePickerProps) => {
  const ref: React.MutableRefObject<HTMLInputElement | null> = useRef(null);

  const { dateFormat: defaultDateFormat = 'DD/MM/YYYY' } =
    useAtomValue<ClientSettings>(settingsAtom);
  const datePickerFormat = (dateFormat || defaultDateFormat).toLowerCase();

  const instance = useRef<Datepicker | null>(null);
  const locale = validateLocale(language) || 'en';

  useEffect((): (() => void) => {
    Object.assign(Datepicker.locales, {
      [locale]: datePickerOptionsByLocale(locale, labelToday, labelClear, datePickerFormat),
    });
    instance.current = new Datepicker(ref.current, {
      container: '#tw-container',
      language: locale,
      labelToday,
      labelClear,
      locales: { [locale]: Datepicker.locales[locale] },
      todayBtnMode: 1,
      todayBtn: true,
      clearBtn: true,
      autohide: true,
      clearFieldAction,
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
    if (ref.current) {
      ref.current.value = newValue;
    }
    debouncedOnChange(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Delete',
      'Backspace',
      'Tab',
      '-',
      '/',
    ];
    const isNumber = /^[0-9]$/.test(e.key);
    const isAllowedKey = allowedKeys.includes(e.key);

    if (!isNumber && !isAllowedKey) {
      e.preventDefault();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    debouncedOnBlur(e);
  };

  return (
    <div className="tw-content">
      <div id="tw-container" className={`absolute z-50 ${className} tw-datepicker w-full`} />
      <div>
        <Label htmlFor={id} hideLabel={hideLabel} hasErrors={Boolean(hasErrors || errorMessage)}>
          {label}
        </Label>

        <div className="flex flex-col gap-1">
          <div className="relative w-full text-gray-600">
            {showCalendarIcon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
              </div>
            )}

            <input
              id={id}
              name={name}
              data-datepicker="true"
              data-datepicker-autohide="true"
              data-datepicker-buttons="true"
              data-datepicker-autoselect-today="true"
              type="text"
              lang={locale}
              defaultValue={value}
              onChange={handleChange}
              onSelect={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              ref={ref}
              disabled={disabled}
              className={`block w-full text-sm border rounded-md pl-10 pr-8 py-1 focus:outline-none focus:border-blue-400 ${
                !(hasErrors || errorMessage)
                  ? `${inputClassName || ''} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 block w-full p-2.5`
                  : `${inputClassName || ''} border-2 border-red-300 text-red-900 bg-red-50 placeholder-red-700 focus:ring-2 focus:ring-red-400 focus:border-red-400 hover:border-red-400`
              } disabled:text-gray-500 placeholder-opacity-100`}
              placeholder={placeholder || dateFormat}
              autoComplete={autoComplete}
              required={required}
            />

            {ref.current?.value && showClearFieldIcon && (
              <button
                type="button"
                data-testid="clear-field-button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-10 "
                onClick={() => {
                  handleChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
                }}
              >
                <XCircleIcon className="w-5 h-5 text-gray-200 dark:text-gray-400 hover:text-red-200" />
              </button>
            )}
          </div>

          {errorMessage && <InputError>{errorMessage}</InputError>}
        </div>
      </div>
    </div>
  );
};

export { DatePickerComponent, datePickerOptionsByLocale, validateLocale };
