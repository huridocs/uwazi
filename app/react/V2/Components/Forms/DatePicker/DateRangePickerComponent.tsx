import React, { useEffect, Ref, ChangeEventHandler, useRef, useImperativeHandle } from 'react';
import { UseFormRegister } from 'react-hook-form';
//@ts-ignore
import DateRangePicker from 'flowbite-datepicker/DateRangePicker';
//@ts-ignore
import Datepicker from 'flowbite-datepicker/Datepicker';
import 'flowbite/dist/flowbite.min.css';
import uniqueID from 'shared/uniqueID';
import { Label } from '../Label';
import { InputError } from '../InputError';
import { InputField } from '../InputField';
import { DatePickerProps, datePickerOptionsByLocale, validateLocale } from './DatePickerComponent';

interface DateRangePickerProps extends DatePickerProps {
  register?: UseFormRegister<any> | (() => {});
  placeholderStart?: string;
  placeholderEnd?: string;
  onFromDateSelected?: ChangeEventHandler<HTMLInputElement>;
  onToDateSelected?: ChangeEventHandler<HTMLInputElement>;
  onClear?: () => void;
}
const DateRangePickerComponent = React.forwardRef(
  (
    {
      labelToday,
      labelClear,
      label,
      disabled,
      placeholderStart,
      placeholderEnd,
      hasErrors,
      errorMessage,
      id = uniqueID(),
      language = 'en',
      dateFormat = 'yyyy-mm-dd',
      hideLabel = true,
      className = '',
      register = () => ({}),
      onFromDateSelected = () => {},
      onToDateSelected = () => {},
      onBlur = () => {},
      onClear = () => {},
    }: DateRangePickerProps,
    forwardedRef: Ref<HTMLInputElement | null>
  ) => {
    const divRef = useRef(null);
    const fromRef = useRef(null);
    const toRef = useRef(null);
    useImperativeHandle(forwardedRef, () => divRef.current);

    const fieldStyles = !(hasErrors || errorMessage)
      ? // eslint-disable-next-line max-len
        `${className || ''} bg-gray-50 border border-gray-300`
      : `${className || ''} border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700`;
    const instance = useRef<DateRangePicker | null>(null);
    const locale = validateLocale(language);

    useEffect(() => {
      Object.assign(Datepicker.locales, {
        [locale]: {
          ...datePickerOptionsByLocale(locale, labelToday, labelClear),
          format: dateFormat.toLowerCase(),
        },
      });
      const startEl = fromRef.current;
      const endEl = toRef.current;

      instance.current = new DateRangePicker(divRef.current, {
        inputs: [startEl, endEl],
        container: '#tw-container',
        language: locale,
        locales: { [locale]: Datepicker.locales[locale] },
        Mode: 1,
        todayBtnMode: 1,
        todayBtn: true,
        clearBtn: true,
        autohide: true,
        format: dateFormat.toLowerCase(),
      });
      return () => (instance?.current?.hide instanceof Function ? instance?.current?.hide() : {});
    }, [locale, labelToday, labelClear, dateFormat]);

    return (
      <div className="tw-content">
        <div id="tw-container" className="relative tw-datepicker" data-test-id={id} />
        <div>
          <Label htmlFor={id} hideLabel={hideLabel} hasErrors={Boolean(hasErrors || errorMessage)}>
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
            <div
              // eslint-disable-next-line max-len
              className="relative "
            >
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400 z-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                </svg>
              </div>
              <InputField
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons={true}
                datepicker-autoselect-today={true}
                name="from"
                {...register('from')}
                type="text"
                onSelect={onFromDateSelected}
                onBlur={onBlur}
                disabled={disabled}
                // eslint-disable-next-line max-len
                className={`[&>div>*:nth-child(odd)]:bg-transparent [&>div>*:nth-child(odd)]:border-0 [&>div>*:nth-child(odd)]:pl-8 ${fieldStyles} bg-gray-50 border border-gray-300 rounded-lg`}
                placeholder={placeholderStart}
                ref={fromRef}
                clearFieldAction={onClear}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400 z-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                </svg>
              </div>
              <InputField
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons={true}
                datepicker-autoselect-today={true}
                id="to"
                name="to"
                {...register('to')}
                type="text"
                onSelect={onToDateSelected}
                onBlur={onBlur}
                disabled={disabled}
                // eslint-disable-next-line max-len
                className={`[&>div>*:nth-child(odd)]:bg-transparent [&>div>*:nth-child(odd)]:border-0 [&>div>*:nth-child(odd)]:pl-8 ${fieldStyles} bg-gray-50 border border-gray-300 rounded-lg`}
                placeholder={placeholderEnd}
                clearFieldAction={onClear}
                ref={toRef}
              />
            </div>
          </div>
          {errorMessage && <InputError>{errorMessage}</InputError>}
        </div>
      </div>
    );
  }
);

DateRangePickerComponent.defaultProps = {
  register: () => ({}),
  placeholderStart: 'Select start',
  placeholderEnd: 'Select end',
  onFromDateSelected: () => {},
  onToDateSelected: () => {},
  onClear: () => {},
};

export type { DateRangePickerProps };
export { DateRangePickerComponent };
