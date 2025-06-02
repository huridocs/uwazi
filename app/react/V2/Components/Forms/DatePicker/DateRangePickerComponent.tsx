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
import { datePickerOptionsByLocale, validateLocale } from './DatePickerComponent';
import { DateRangePickerProps, handleKeyDown } from './dateUtils';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom } from 'app/V2/atoms';
import { useAtomValue } from 'jotai';
import { Translate } from 'app/I18N';

const DateRangePickerComponent = ({
  id = uniqueID(),
  model,
  value = { from: '', to: '' },
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
  placeholderStart,
  placeholderEnd,
  hasErrors = false,
  errorMessage,
  onFromDateSelected = () => { },
  onToDateSelected = () => { },
  onBlur = () => { },
  showCalendarIcon = true,
  showClearFieldIcon = true,
  required = false,
  fromInputRef: externalFromRef,
  toInputRef: externalToRef,
  horizontal = false,
}: DateRangePickerProps) => {
  const { dateFormat: defaultDateFormat = 'DD/MM/YYYY' } =
    useAtomValue<ClientSettings>(settingsAtom);
  const datePickerFormat = (dateFormat || defaultDateFormat).toLowerCase();
  const divRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const internalFromRef = useRef<HTMLInputElement>(null);
  const internalToRef = useRef<HTMLInputElement>(null);
  const instance = useRef<DateRangePicker | null>(null);
  const locale = validateLocale(language);

  const fromInputRef = externalFromRef || internalFromRef;
  const toInputRef = externalToRef || internalToRef;

  useEffect((): (() => void) => {
    Object.assign(Datepicker.locales, {
      [locale]: {
        ...datePickerOptionsByLocale(locale, labelToday, labelClear, datePickerFormat),
        format: datePickerFormat,
      },
    });
    Object.assign(DateRangePicker?.locales || {}, {
      [locale]: {
        ...datePickerOptionsByLocale(locale, labelToday, labelClear, datePickerFormat),
        format: datePickerFormat,
      },
    });
    const startEl = fromInputRef?.current;
    const endEl = toInputRef?.current;
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
  }, 300);

  const debouncedOnToDateSelected = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue !== value.to && (newValue === '' || newValue.length === 10)) {
      onToDateSelected(e);
    }
  }, 300);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (fromInputRef?.current) {
      fromInputRef.current.value = newValue;
    }
    debouncedOnFromToDateSelected(e);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (toInputRef?.current) {
      toInputRef.current.value = newValue;
    }
    debouncedOnToDateSelected(e);
  };

  const debouncedOnBlur = debounce((e: React.FocusEvent<HTMLInputElement>) => {
    onBlur(e);
  }, 300);

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
          date-rangepicker="true"
          datepicker-buttons="true"
          datepicker-autoselect-today="true"
          className={`flex items-center gap-4 ${horizontal ? 'items-center' : 'flex-col'}`}
        >
          <div
            className={`relative ${horizontal ? 'w-1/2' : 'w-full'} text-gray-600 DatePicker__From`}
          >
            {showCalendarIcon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex gap-1">
                <CalendarDateRangeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <Translate translationKey='Label date "From"'>From:</Translate>
              </div>
            )}

            <input
              id="from"
              name={model ? `${model}.from` : 'dateField'}
              data-datepicker={true}
              data-datepicker-autohide={true}
              data-datepicker-buttons={true}
              data-datepicker-autoselect-today={true}
              type="text"
              lang={locale}
              defaultValue={value?.from || ''}
              onChange={handleFromChange}
              onSelect={handleFromChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              ref={fromInputRef}
              disabled={disabled}
              className={`
                form-control datepicker-input block w-full text-sm h-8 rounded-lg pl-[80px] pr-8
                placeholder-opacity-100 placeholder-gray-500
                ${inputClassName || ''}
                ${hasErrors || errorMessage
                  ? 'border-2 !border-red-300 text-red-900 bg-red-50 hover:border-red-400 focus:!border-form-error-border focus:outline-none focus:!shadow-form-error focus:!ring-0'
                  : 'bg-gray-50 border border-gray-300 text-gray-900 hover:border-gray-400 focus:!border-[#66afe9] focus:outline-none focus:!shadow-form-focus focus:!ring-0'
                }
              `}
              placeholder={placeholderStart || dateFormat}
              autoComplete={autoComplete}
              required={required}
            />

            {Boolean(value?.from) && showClearFieldIcon && (
              <button
                type="button"
                data-testid="clear-field-button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-10 "
                onClick={clearFromValue}
              >
                <XCircleIcon className="w-5 h-5 text-gray-200 dark:text-gray-400 hover:text-red-200" />
              </button>
            )}
          </div>

          <div
            className={`relative ${horizontal ? 'w-1/2' : 'w-full'} text-gray-600 date-range-to DatePicker__To`}
          >
            {showCalendarIcon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex gap-1">
                <CalendarDateRangeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <Translate translationKey='Label date "to"'>To:</Translate>
              </div>
            )}

            <input
              id="to"
              name={model ? `${model}.to` : 'dateField'}
              data-datepicker={true}
              data-datepicker-autohide={true}
              data-datepicker-buttons={true}
              data-datepicker-autoselect-today={true}
              type="text"
              lang={locale}
              defaultValue={value?.to || ''}
              onChange={handleToChange}
              onSelect={handleToChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              ref={toInputRef}
              disabled={disabled}
              className={`
                form-control datepicker-input block w-full text-sm h-8 rounded-lg pl-[80px] pr-8
                placeholder-opacity-100 placeholder-gray-500
                ${inputClassName || ''}
                ${hasErrors || errorMessage
                  ? 'border-2 !border-red-300 text-red-900 bg-red-50 hover:border-red-400 focus:!border-form-error-border focus:outline-none focus:!shadow-form-error focus:!ring-0'
                  : 'bg-gray-50 border border-gray-300 text-gray-900 hover:border-gray-400 focus:!border-[#66afe9] focus:outline-none focus:!shadow-form-focus focus:!ring-0'
                }
              `}
              placeholder={placeholderEnd || dateFormat}
              autoComplete={autoComplete}
              required={required}
            />

            {Boolean(value?.to) && showClearFieldIcon && (
              <button
                type="button"
                data-testid="clear-field-button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-10 "
                onClick={clearToValue}
              >
                <XCircleIcon className="w-5 h-5 text-gray-200 dark:text-gray-400 hover:text-red-200" />
              </button>
            )}
          </div>
        </div>
        {errorMessage && <InputError>{errorMessage}</InputError>}
      </div>
    </div>
  );
};

export { DateRangePickerComponent };
