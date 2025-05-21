/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useRef } from 'react';
//Module has no types
//@ts-ignore
import { Datepicker, DateRangePicker } from 'flowbite-datepicker';
import 'flowbite/dist/flowbite.min.css';
import { debounce } from 'app/utils';
import { CalendarDateRangeIcon, XCircleIcon } from '@heroicons/react/20/solid';
import uniqueID from 'shared/uniqueID';
import { Label } from '../Label';
import { InputError } from '../InputError';
import { DatePickerProps, datePickerOptionsByLocale, validateLocale } from './DatePickerComponent';

interface DateRangePickerProps extends Omit<DatePickerProps, 'value'> {
  language: string;
  dateFormat?: string;
  hideLabel?: boolean;
  className?: string;
  model?: string;
  value?: {
    from: string | number | null;
    to: string | number | null;
  };
  onSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholderStart?: string;
  placeholderEnd?: string;
  onFromDateSelected?: any;
  onToDateSelected?: any;
  disabled?: boolean;
  hasErrors?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  showCalendarIcon?: boolean;
  showClearFieldIcon?: boolean;
}

const DateRangePickerComponent = React.forwardRef(
  ({
    id = uniqueID(),
    model,
    value = { from: '', to: '' },
    language = 'en',
    dateFormat = 'YYYY-MM-DD',
    hideLabel = false,
    inputClassName = '',
    className = '',
    labelToday = 'Today',
    labelClear = 'Clear',
    label,
    disabled = false,
    placeholderStart = 'Inicio',
    placeholderEnd = 'Fin',
    hasErrors = false,
    errorMessage,
    onFromDateSelected = () => { },
    onToDateSelected = () => { },
    onBlur = () => { },
    showCalendarIcon = true,
    showClearFieldIcon = true,
  }: DateRangePickerProps) => {
    const datePickerFormat = dateFormat.toLowerCase();
    const divRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
    const fromRef: React.MutableRefObject<HTMLInputElement | null> = useRef(null);
    const toRef: React.MutableRefObject<HTMLInputElement | null> = useRef(null);

    const instance = useRef<DateRangePicker | null>(null);
    const locale = validateLocale(language);

    useEffect((): (() => void) => {
      Object.assign(Datepicker.locales, {
        [locale]: {
          ...datePickerOptionsByLocale(locale, labelToday, labelClear),
          format: datePickerFormat,
        },
      });
      Object.assign(DateRangePicker?.locales || {}, {
        [locale]: {
          ...datePickerOptionsByLocale(locale, labelToday, labelClear),
          format: datePickerFormat,
        },
      });
      const startEl = fromRef.current;
      const endEl = toRef.current;
      const options = {
        inputs: [startEl!, endEl!],
        container: '#tw-container',
        language: locale,
        locales: { [locale]: Datepicker.locales[locale] },
        Mode: 1,
        todayBtnMode: 1,
        todayBtn: true,
        clearBtn: true,
        autohide: true,
        allowOneSidedRange: true,
        format: datePickerFormat,
      };
      instance.current = new DateRangePicker(divRef.current!, options);

      if (instance.current) {
        instance.current.setDates(value?.from, value?.to);
      }
      return () => (instance?.current?.hide instanceof Function ? instance?.current?.hide() : {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locale, datePickerFormat, labelToday, labelClear]);

    const debouncedOnFromToDateSelected = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue !== value.from && (newValue === '' || newValue.length === 10)) {
        onFromDateSelected(e);
      }
    }, 1000);

    const debouncedOnToDateSelected = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue !== value.to && (newValue === '' || newValue.length === 10)) {
        onToDateSelected(e);
      }
    }, 1000);

    const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (fromRef.current) {
        fromRef.current.value = newValue;
      }
      debouncedOnFromToDateSelected(e);
    };

    const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (toRef.current) {
        toRef.current.value = newValue;
      }
      debouncedOnToDateSelected(e);
    };

    const debouncedOnBlur = debounce((e: React.FocusEvent<HTMLInputElement>) => {
      onBlur(e);
    }, 1000);

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

    const clearFromValue = () => {
      instance.current?.setDates({ clear: true }, value?.to);
      handleFromChange({
        target: {
          value: '',
        },
      } as any);
    };
    const clearToValue = () => {
      instance.current?.setDates(value?.from, { clear: true });
      handleToChange({
        target: {
          value: '',
        },
      } as any);

    };
    return (
      <div className="tw-content">
        <div
          id="tw-container"
          className={`${className} tw-datepicker z-50 w-full inline-block p-0`}
          data-test-id={id}
        />
        <div>
          <Label
            htmlFor={id}
            hideLabel={hideLabel}
            hasErrors={Boolean(hasErrors || errorMessage)}
          >
            {label}
          </Label>

          <div
            ref={divRef}
            id={id}
            date-rangepicker="true"
            datepicker-buttons="true"
            datepicker-autoselect-today="true"
            className="flex items-center gap-4"
          >
            <div className="relative w-1/2 text-gray-600">
              {showCalendarIcon && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <CalendarDateRangeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              )}

              <input
                id="from"
                name={model ? `${model}.from` : 'dateField'}
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons={true}
                datepicker-autoselect-today={true}
                type="text"
                defaultValue={value?.from || ''}
                onChange={handleFromChange}
                onSelect={handleFromChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`
            block w-full text-sm h-8 rounded-lg pl-10 pr-8
            placeholder-opacity-100 placeholder-gray-500
            ${inputClassName || ''}
            ${hasErrors || errorMessage
                    ? 'border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700'
                    : 'border border-gray-300 focus:outline-none focus:lightBlue-400 focus:border-lightBlue-400'
                  }
          `}
                placeholder={placeholderStart || dateFormat}
                ref={fromRef}
                clearFieldAction={clearFromValue}
              />

              {Boolean(value?.from) && showClearFieldIcon && (
                <button data-testid="clear-field-button" className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-10 " onClick={clearFromValue}>
                  <XCircleIcon className="w-5 h-5 text-gray-200 dark:text-gray-400 hover:text-red-200" />
                </button>
              )}
            </div>

            <div className="relative w-1/2 text-gray-600">
              {showCalendarIcon && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <CalendarDateRangeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              )}

              <input
                id="to"
                name={model ? `${model}.to` : 'dateField'}
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons={true}
                datepicker-autoselect-today={true}
                type="text"
                defaultValue={value?.to || ''}
                onChange={handleToChange}
                onSelect={handleToChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`
            block w-full text-sm h-8 rounded-lg pl-10 pr-8
            placeholder-opacity-100 placeholder-gray-500
            ${inputClassName || ''}
            ${hasErrors || errorMessage
                    ? 'border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700'
                    : 'border border-gray-300 focus:outline-none focus:lightBlue-400 focus:border-lightBlue-400'
                  }
          `}
                placeholder={placeholderEnd || dateFormat}
                ref={toRef}
                clearFieldAction={clearToValue}
              />

              {Boolean(value?.to) && showClearFieldIcon && (
                <button data-testid="clear-field-button" className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-10 " onClick={clearToValue}>
                  <XCircleIcon className="w-5 h-5 text-gray-200 dark:text-gray-400 hover:text-red-200" />
                </button>
              )}
            </div>
          </div>
          {errorMessage && <InputError>{errorMessage}</InputError>}
        </div>
      </div>

    );
  }
);

export type { DateRangePickerProps };
export { DateRangePickerComponent };
