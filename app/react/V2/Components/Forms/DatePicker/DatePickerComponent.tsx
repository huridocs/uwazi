import React, { useEffect, Ref, useRef, useImperativeHandle } from 'react';

//Module has no types
//@ts-ignore
import { Datepicker } from 'flowbite-datepicker';
import 'flowbite/dist/flowbite.min.css';
import { CalendarIcon, XCircleIcon } from '@heroicons/react/20/solid';
import uniqueID from 'shared/uniqueID';
import { debounce } from 'app/utils';
import { Label } from '../Label';
import { InputError } from '../InputError';
import { datePickerOptionsByLocale, DatePickerProps, defaultDateFormat, validateLocale } from './dateUtils';

const DatePickerComponent = React.forwardRef(
  (
    {
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
      dateFormat = defaultDateFormat,
      hideLabel = true,
      inputClassName = '',
      className = '',
      name = 'date',
      onChange = () => { },
      onBlur = () => { },
      clearFieldAction = () => { },
      useTimezone = false,
      endOfDay = false,
      showCalendarIcon = true,
      showClearFieldIcon = true,
    }: DatePickerProps,
    forwardedRef: Ref<{ setValue: (val: string) => void }>
  ) => {
    const ref: React.MutableRefObject<HTMLInputElement | null> = useRef(null);
    useImperativeHandle(forwardedRef, () => ({
      setValue: (val: string) => {
        if (ref.current) ref.current.value = val;
      },
    }));

    const datePickerFormat = dateFormat.toLowerCase();
    const fieldStyles = !(hasErrors || errorMessage)
      ? `${inputClassName || ''} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:lightBlue-400 focus:border-lightBlue-400 block w-full p-2.5`
      : `${inputClassName || ''} border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700`;

    const instance = useRef<Datepicker | null>(null);
    const locale = validateLocale(language) || 'en';

    useEffect((): (() => void) => {
      Object.assign(Datepicker.locales, {
        [locale]: datePickerOptionsByLocale(locale, labelToday, labelClear, datePickerFormat)
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
      if (newValue !== value && newValue.length === 10) {
        onChange(e);
      }
    }, 1000);

    const debouncedOnBlur = debounce((e: React.FocusEvent<HTMLInputElement>) => {
      onBlur(e);
    }, 1000);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (ref.current) {
        ref.current.value = newValue;
      }
      debouncedOnChange(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Backspace', 'Tab', '-', '/'];
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
                // @ts-ignore
                datepicker="true"
                datepicker-autohide="true"
                datepicker-buttons="true"
                datepicker-autoselect-today="true"
                type="text"
                lang={locale}
                onChange={handleChange}
                onSelect={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                name={name}
                ref={ref}
                disabled={disabled}
                defaultValue={value}
                className={`block w-full text-sm border rounded-md pl-10 pr-8 py-1 focus:outline-none focus:border-blue-400 ${fieldStyles} disabled:text-gray-500 placeholder-opacity-100`}
                placeholder={placeholder || dateFormat}
                autoComplete={autoComplete}
              />

              {ref.current?.value && showClearFieldIcon && (
                <button data-testid="clear-field-button" className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-10 " onClick={() => {
                  handleChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
                }}>
                  <XCircleIcon className="w-5 h-5 text-gray-200 dark:text-gray-400 hover:text-red-200" />
                </button>
              )}
            </div>

            {errorMessage && <InputError>{errorMessage}</InputError>}
          </div>
        </div>
      </div>

    );
  }
);

export type { DatePickerProps };
export { DatePickerComponent, datePickerOptionsByLocale, validateLocale };
