import React, { useEffect, Ref, useRef, useImperativeHandle } from 'react';
import 'flowbite/dist/flowbite.min.css';
import uniqueID from '#shared/uniqueID.js';
import { Label } from '../Label.js';
import { InputError } from '../InputError.js';
import { InputField } from '../InputField.js';
import { DatePickerProps, validateLocale } from './DatePickerComponent.js';
import { mountDateRange } from './dateRangeMount.js';
import { dateFromTimestamp, hasBound } from './rangeTimestamp.js';

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
      placeholderStart = 'Select start',
      placeholderEnd = 'Select end',
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
    const divRef = useRef<HTMLInputElement | null>(null);
    const fromRef = useRef<HTMLInputElement>(null);
    const toRef = useRef<HTMLInputElement>(null);
    useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
      forwardedRef,
      () => divRef.current
    );

    const fieldStyles = inputClassName || '';
    const instance = useRef<ReturnType<typeof mountDateRange>['picker'] | null>(null);
    const locale = validateLocale(language);

    useEffect(() => {
      const mounted = mountDateRange({
        container: divRef.current,
        fromEl: fromRef.current,
        toEl: toRef.current,
        locale,
        labelToday,
        labelClear,
        dateFormat,
        from,
        to,
        onFromDateSelected,
        onToDateSelected,
      });
      instance.current = mounted.picker;
      return () => {
        mounted.stop();
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
      if (hasBound(from) || hasBound(to)) {
        instance.current.setDates(dateFromTimestamp(from), dateFromTimestamp(to));
        return;
      }
      instance.current.setDates({ clear: true }, { clear: true });
    }, [instance, from, to]);

    return (
      <div className="tw-content">
        <div
          id="tw-container"
          className={`${className} absolute tw-datepicker z-50`}
          data-test-id={id}
        />
        <div className="flex flex-col gap-1.5">
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
                datepicker
                datepicker-autohide
                datepicker-buttons
                datepicker-autoselect-today
                type="text"
                disabled={disabled}
                hasErrors={Boolean(hasErrors || errorMessage)}
                className={`[&>div>*:nth-child(odd)]:bg-transparent [&>div>*:nth-child(odd)]:border-0 [&>div>*:nth-child(odd)]:pl-8 ${fieldStyles}`}
                placeholder={placeholderStart}
                ref={fromRef}
                showClear={hasBound(from)}
                clearFieldAction={
                  hasBound(from)
                    ? () => {
                        instance.current?.setDates({ clear: true }, dateFromTimestamp(to));
                        onClear('from');
                      }
                    : undefined
                }
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
                datepicker
                datepicker-autohide
                datepicker-buttons
                datepicker-autoselect-today
                type="text"
                disabled={disabled}
                hasErrors={Boolean(hasErrors || errorMessage)}
                className={`[&>div>*:nth-child(odd)]:bg-transparent [&>div>*:nth-child(odd)]:border-0 [&>div>*:nth-child(odd)]:pl-8 ${fieldStyles}`}
                placeholder={placeholderEnd}
                showClear={hasBound(to)}
                clearFieldAction={
                  hasBound(to)
                    ? () => {
                        instance.current?.setDates(dateFromTimestamp(from), { clear: true });
                        onClear('to');
                      }
                    : undefined
                }
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

export type { DateRangePickerProps };
export { DateRangePickerComponent };
