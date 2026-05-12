import React, { useEffect, Ref, useRef, useImperativeHandle } from 'react';
//@ts-ignore
import DateRangePicker from 'flowbite-datepicker/DateRangePicker';
//@ts-ignore
import Datepicker from 'flowbite-datepicker/Datepicker';
import 'flowbite/dist/flowbite.min.css';
import uniqueID from '#shared/uniqueID.js';
import { Label } from '../Label.js';
import { InputError } from '../InputError.js';
import { InputField } from '../InputField.js';
import {
  DatePickerProps,
  datePickerOptionsByLocale,
  validateLocale,
} from './DatePickerComponent.js';

interface DateRangePickerProps extends Omit<DatePickerProps, 'dateFormat'> {
  dateFormat?: string;
  placeholderStart?: string;
  placeholderEnd?: string;
  onFromDateSelected?: (timestamp: number | null) => void;
  onToDateSelected?: (timestamp: number | null) => void;
  from?: number;
  to?: number;
  onClear?: (field: 'from' | 'to') => void;
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
      dateFormat,
      hideLabel = false,
      inputClassName = '',
      className = '',
      onFromDateSelected,
      onToDateSelected,
      from,
      to,
      onClear = () => {},
    }: DateRangePickerProps,
    forwardedRef: Ref<HTMLInputElement | null>
  ) => {
    const divRef = useRef(null);
    const fromRef = useRef<HTMLInputElement>(null);
    const toRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(forwardedRef, () => divRef.current);

    const fieldStyles = inputClassName || '';
    const instance = useRef<DateRangePicker | null>(null);
    const locale = validateLocale(language);

    useEffect(() => {
      // Convert moment format to flowbite format if provided (YYYY -> yyyy, DD -> dd, then lowercase)
      const flowbiteFormat = dateFormat
        ? dateFormat.replace(/YYYY/g, 'yyyy').replace(/DD/g, 'dd').toLowerCase()
        : undefined;

      const localeConfig = {
        ...datePickerOptionsByLocale(locale, labelToday, labelClear),
        ...(flowbiteFormat && { format: flowbiteFormat }),
      };
      Object.assign(Datepicker.locales, {
        [locale]: localeConfig,
      });

      const startEl = fromRef.current;
      const endEl = toRef.current;

      const dateRangeConfig = {
        inputs: [startEl, endEl],
        container: '#tw-container',
        language: locale,
        locales: { [locale]: Datepicker.locales[locale] },
        Mode: 1,
        todayBtnMode: 1,
        todayBtn: true,
        clearBtn: true,
        autohide: true,
        ...(flowbiteFormat && { format: flowbiteFormat }),
      };

      instance.current = new DateRangePicker(divRef.current, dateRangeConfig);

      // Set initial dates from timestamps after a tick to let Flowbite initialize
      if (from || to) {
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        instance.current?.setDates(fromDate, toDate);
      }

      // Listen to Flowbite's changeDate events which provide Date objects
      const fromEl = fromRef.current;
      const toEl = toRef.current;

      const fromHandler = (e: any) => {
        const date = e.detail?.date;
        const timestamp = date ? date.getTime() : null;
        onFromDateSelected?.(timestamp);
      };

      const toHandler = (e: any) => {
        const date = e.detail?.date;
        const timestamp = date ? date.getTime() : null;
        onToDateSelected?.(timestamp);
      };

      fromEl?.addEventListener('changeDate', fromHandler);
      toEl?.addEventListener('changeDate', toHandler);

      return () => {
        fromEl?.removeEventListener('changeDate', fromHandler);
        toEl?.removeEventListener('changeDate', toHandler);
        if (instance?.current?.hide instanceof Function) instance?.current?.hide();
      };
    }, [
      locale,
      labelToday,
      labelClear,
      dateFormat,
      from,
      to,
      onFromDateSelected,
      onToDateSelected,
    ]);

    useEffect(() => {
      if (!instance.current) {
        return;
      }
      if (from || to) {
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        instance.current.setDates(fromDate, toDate);
      } else {
        instance.current.setDates({ clear: true }, { clear: true });
      }
    }, [instance, from, to]);

    return (
      <div className="tw-content">
        <div
          id="tw-container"
          className={`${className} absolute tw-datepicker z-50`}
          data-test-id={id}
        />
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
            <div className="relative ">
              <div className="absolute inset-y-0 flex items-center pointer-events-none inset-s-0 ps-3">
                <svg
                  className="z-3 h-4 w-4 text-(--color-theme-control-text-muted)"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                </svg>
              </div>
              <InputField
                id="from"
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons={true}
                datepicker-autoselect-today={true}
                type="text"
                disabled={disabled}
                hasErrors={Boolean(hasErrors || errorMessage)}
                className={`[&>div>*:nth-child(odd)]:bg-transparent [&>div>*:nth-child(odd)]:border-0 [&>div>*:nth-child(odd)]:pl-8 ${fieldStyles}`}
                placeholder={placeholderStart}
                ref={fromRef}
                clearFieldAction={() => {
                  const toDate = to ? new Date(to) : undefined;
                  instance.current.setDates({ clear: true }, toDate);
                  onClear('from');
                }}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 flex items-center pointer-events-none inset-s-0 ps-3">
                <svg
                  className="z-3 h-4 w-4 text-(--color-theme-control-text-muted)"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                </svg>
              </div>
              <InputField
                id="to"
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons={true}
                datepicker-autoselect-today={true}
                type="text"
                disabled={disabled}
                hasErrors={Boolean(hasErrors || errorMessage)}
                className={`[&>div>*:nth-child(odd)]:bg-transparent [&>div>*:nth-child(odd)]:border-0 [&>div>*:nth-child(odd)]:pl-8 ${fieldStyles}`}
                placeholder={placeholderEnd}
                clearFieldAction={() => {
                  const fromDate = from ? new Date(from) : undefined;
                  instance.current.setDates(fromDate, { clear: true });
                  onClear('to');
                }}
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
  placeholderStart: 'Select start',
  placeholderEnd: 'Select end',
  dateFormat: undefined,
  onFromDateSelected: undefined,
  onToDateSelected: undefined,
  from: undefined,
  to: undefined,
  onClear: () => {},
};

export type { DateRangePickerProps };
export { DateRangePickerComponent };
