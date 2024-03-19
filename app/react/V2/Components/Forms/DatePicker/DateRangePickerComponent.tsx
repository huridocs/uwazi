import React, { useEffect, Ref, useRef } from 'react';
//@ts-ignore
import DateRangePicker from 'flowbite-datepicker/DateRangePicker';
import 'flowbite/dist/flowbite.min.css';
import uniqueID from 'shared/uniqueID';
import { Label } from '../Label';
import { InputError } from '../InputError';
import { DatePickerProps, datePickerOptionsByLocale } from './DatePickerComponent';

interface DateRangePickerProps extends DatePickerProps {
  from: number;
  to: number;
  placeholderStart: string;
  placeholderEnd: string;
}
const DateRangePickerComponent = React.forwardRef(
  (
    {
      language = 'en',
      labelToday,
      labelClear,
      id = uniqueID(),
      label,
      disabled,
      placeholderStart,
      placeholderEnd,
      hasErrors,
      errorMessage,
      from,
      to,
      showTodayButton,
      hideLabel = false,
      className = '',
      name = '',
      onChange = () => {},
      onBlur = () => {},
    }: DateRangePickerProps,
    ref: Ref<any>
  ) => {
    const fieldStyles = !(hasErrors || errorMessage)
      ? `${className} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`
      : `${className} border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700`;
    const instance = useRef<DateRangePicker | null>(null);

    useEffect(() => {
      const datePickerEl = document.getElementById('dateRangePickerId');
      const startEl = document.getElementById('start');
      const endEl = document.getElementById('end');

      instance.current = new DateRangePicker(datePickerEl, {
        inputs: [startEl, endEl],
        container: '#tw-container',
        language,
        locales: { language: datePickerOptionsByLocale },
      });
    }, [language, labelToday, labelClear]);

    const handleOnChange = e => {
      onChange({ ...e, value: instance.current.dates });
    };

    return (
      <div className="tw-content">
        <div id="tw-container" className="relative tw-datepicker" />
        <div>
          <Label htmlFor={id} hideLabel={hideLabel} hasErrors={Boolean(hasErrors || errorMessage)}>
            {label}
          </Label>
          <div
            id="dateRangePickerId"
            date-rangepicker={true}
            datepicker-buttons
            datepicker-autoselect-today
            className="flex items-center"
          >
            <div className="relative">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                </svg>
              </div>
              <input
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons
                datepicker-autoselect-today
                id="start"
                name="start"
                type="text"
                onChange={handleOnChange}
                onSelect={handleOnChange}
                onBlur={onBlur}
                disabled={disabled}
                value={from}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder={placeholderStart}
              />
            </div>
            <span className="mx-4 text-gray-500">to</span>
            <div className="relative">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                </svg>
              </div>
              <input
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons
                datepicker-autoselect-today
                id="end"
                name="end"
                type="text"
                onChange={handleOnChange}
                onSelect={handleOnChange}
                onBlur={onBlur}
                disabled={disabled}
                value={to}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder={placeholderEnd}
              />
            </div>
          </div>
          {errorMessage && <InputError>{errorMessage}</InputError>}
        </div>
      </div>
    );
  }
);

export { DateRangePickerComponent };
