/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, Ref, useRef, useImperativeHandle } from 'react';
import moment from 'moment';
import { isNumber } from 'lodash';
//Module has no types
//@ts-ignore
import { Datepicker, DateRangePicker } from 'flowbite-datepicker';
import 'flowbite/dist/flowbite.min.css';
import { debounce } from 'app/utils';
import uniqueID from 'shared/uniqueID';
import { Label } from '../Label';
import { InputError } from '../InputError';
import { InputField } from '../InputField';
import { DatePickerProps, datePickerOptionsByLocale, validateLocale } from './DatePickerComponent';

interface DateRangePickerProps extends Omit<DatePickerProps, 'value'> {
  language: string;
  dateFormat?: string;
  useTimezone?: boolean;
  endOfDay?: boolean;
  hideLabel?: boolean;
  className?: string;
  model?: string;
  value?: {
    from: string | number | null;
    to: string | number | null;
  };
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholderStart?: string;
  placeholderEnd?: string;
  onFromDateSelected?: any;
  onToDateSelected?: any;
  onClear?: (field: 'from' | 'to') => void;
  disabled?: boolean;
  hasErrors?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const DateRangePickerComponent = React.forwardRef(
  (
    {
      id = uniqueID(),
      model,
      value = { from: '', to: '' },
      useTimezone = false,
      endOfDay = false,
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
      onClear = () => { },
      onBlur = () => { },
    }: DateRangePickerProps,
    forwardedRef: Ref<HTMLInputElement | null>
  ) => {
    const datePickerFormat = dateFormat.toLowerCase();
    const divRef = useRef(null);
    const fromRef = useRef<HTMLInputElement>(null);
    const toRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(forwardedRef, () => divRef.current);

    const instance = useRef<DateRangePicker | null>(null);
    const locale = validateLocale(language);

    const formatValue = (val: string | number | null) => {
      if (!val) return '';
      if (isNumber(val)) {
        const date = useTimezone ? moment.unix(val) : moment.utc(val * 1000);
        return date.format(datePickerFormat);
      }
      return val;
    };

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
        instance.current.setDates(formatValue(value?.from), formatValue(value?.to));
      }
      return () => (instance?.current?.hide instanceof Function ? instance?.current?.hide() : {});
    }, [locale, datePickerFormat, labelToday, labelClear]);

    useEffect(() => {
      if (!instance.current) {
        return;
      }
      if (value?.from || value?.to) {
        instance.current.setDates(formatValue(value?.from), formatValue(value?.to));
      } else {
        instance.current.setDates({ clear: true }, { clear: true });
      }
    }, [instance, value, useTimezone, datePickerFormat]);

    const debouncedOnFromToDateSelected = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue !== value.from && newValue.length === 10) {
        onFromDateSelected(e);
      }
    }, 1000);

    const debouncedOnToDateSelected = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue !== value.to && newValue.length === 10) {
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

    return (
      <div className="tw-content">
        <div
          id="tw-container"
          className={`${className} absolute tw-datepicker z-50 w-full`}
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
            <div className="relative w-full">
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
                id="from"
                name={model ? `${model}.from` : `${id}_from`}
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons={true}
                datepicker-autoselect-today={true}
                type="text"
                defaultValue={formatValue(value?.from)}
                onChange={handleFromChange}
                onSelect={handleFromChange}
                onBlur={onBlur}
                disabled={disabled}
                className={`[&>div>*:nth-child(odd)]:bg-transparent [&>div>*:nth-child(odd)]:border-0 [&>div>*:nth-child(odd)]:pl-8 ${inputClassName || ''} rounded-lg ${hasErrors || errorMessage
                  ? '[&>div>*:nth-child(odd)]:border-error-300 [&>div>*:nth-child(odd)]:focus:border-error-500 [&>div>*:nth-child(odd)]:focus:ring-error-500 [&>div>*:nth-child(odd)]:border-2 [&>div>*:nth-child(odd)]:text-error-900 [&>div>*:nth-child(odd)]:bg-error-50 [&>div>*:nth-child(odd)]:placeholder-error-700'
                  : '[&>div>*:nth-child(odd)]:bg-gray-50 [&>div>*:nth-child(odd)]:border [&>div>*:nth-child(odd)]:border-gray-300'
                  }`}
                placeholder={placeholderStart || dateFormat}
                ref={fromRef}
                clearFieldAction={() => {
                  instance.current?.setDates({ clear: true }, formatValue(value?.to));
                  onClear('from');
                }}
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
                id="to"
                name={model ? `${model}.to` : `${id}_to`}
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons={true}
                datepicker-autoselect-today={true}
                type="text"
                defaultValue={formatValue(value?.to)}
                onChange={handleToChange}
                onSelect={handleToChange}
                onBlur={onBlur}
                disabled={disabled}
                className={`[&>div>*:nth-child(odd)]:bg-transparent [&>div>*:nth-child(odd)]:border-0 [&>div>*:nth-child(odd)]:pl-8 ${inputClassName || ''} rounded-lg ${hasErrors || errorMessage
                  ? '[&>div>*:nth-child(odd)]:border-error-300 [&>div>*:nth-child(odd)]:focus:border-error-500 [&>div>*:nth-child(odd)]:focus:ring-error-500 [&>div>*:nth-child(odd)]:border-2 [&>div>*:nth-child(odd)]:text-error-900 [&>div>*:nth-child(odd)]:bg-error-50 [&>div>*:nth-child(odd)]:placeholder-error-700'
                  : '[&>div>*:nth-child(odd)]:bg-gray-50 [&>div>*:nth-child(odd)]:border [&>div>*:nth-child(odd)]:border-gray-300'
                  }`}
                placeholder={placeholderEnd || dateFormat}
                clearFieldAction={() => {
                  instance.current?.setDates(formatValue(value?.from), { clear: true });
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

export type { DateRangePickerProps };
export { DateRangePickerComponent };
