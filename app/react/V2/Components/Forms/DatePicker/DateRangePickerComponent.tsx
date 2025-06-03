/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useRef } from 'react';
//Module has no types
//@ts-ignore
import { Datepicker, DateRangePicker } from 'flowbite-datepicker';
import 'flowbite/dist/flowbite.min.css';
import { useAtomValue } from 'jotai';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom } from 'V2/atoms';
import { debounce } from 'app/utils';
import uniqueID from 'shared/uniqueID';
import { Label } from '../Label';
import { InputError } from '../InputError';
import { datePickerOptionsByLocale, validateLocale } from './DatePickerComponent';
import { handleKeyDown } from './dateUtils';
import { DateRangePickerProps } from './types';
import { DateRangeContainer } from './components/DateRangeContainer';
import { DateRangeInput } from './components/DateRangeInput';

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
  onFromDateSelected = () => {},
  onToDateSelected = () => {},
  onBlur = () => {},
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
  const containerId = `drp-${id}`;
  const divRef = useRef<HTMLDivElement>(null);
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
    <DateRangeContainer className={className} id={containerId}>
      {label !== undefined && (
        <Label
          htmlFor={containerId}
          hideLabel={hideLabel}
          hasErrors={Boolean(hasErrors || errorMessage)}
        >
          {label}
        </Label>
      )}

      <div
        ref={divRef}
        id={containerId}
        date-rangepicker="true"
        datepicker-buttons="true"
        datepicker-autoselect-today="true"
        className={`flex items-center gap-4 ${horizontal ? 'items-center' : 'flex-col'}`}
      >
        <DateRangeInput
          id="From"
          model={model ? `${model}.from` : 'dateField'}
          value={value?.from || ''}
          onChange={handleFromChange}
          onBlur={debouncedOnBlur}
          onKeyDown={handleKeyDown}
          inputRef={fromInputRef}
          disabled={disabled}
          inputClassName={inputClassName}
          hasErrors={hasErrors}
          errorMessage={errorMessage}
          placeholder={placeholderStart || dateFormat}
          autoComplete={autoComplete}
          required={required}
          showCalendarIcon={showCalendarIcon}
          showClearFieldIcon={showClearFieldIcon}
          onClear={clearFromValue}
          horizontal={horizontal}
          label="From:"
          language={language}
        />
        <DateRangeInput
          id="To"
          model={model ? `${model}.to` : 'dateField'}
          value={value?.to || ''}
          onChange={handleToChange}
          onBlur={debouncedOnBlur}
          onKeyDown={handleKeyDown}
          inputRef={toInputRef}
          disabled={disabled}
          inputClassName={inputClassName}
          hasErrors={hasErrors}
          errorMessage={errorMessage}
          placeholder={placeholderEnd || dateFormat}
          autoComplete={autoComplete}
          required={required}
          showCalendarIcon={showCalendarIcon}
          showClearFieldIcon={showClearFieldIcon}
          onClear={clearToValue}
          horizontal={horizontal}
          label="To:"
          language={language}
        />
      </div>

      {hasErrors && errorMessage && <InputError>{errorMessage}</InputError>}
    </DateRangeContainer>
  );
};

export { DateRangePickerComponent };
