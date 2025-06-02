import React, { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import moment from 'moment-timezone';
import { settingsAtom } from 'app/V2/atoms';
import { ClientSettings } from 'app/apiResponseTypes';
import { removeOffset, addOffset, formatDate } from './dateUtils';
import { LazyDatePicker } from './loadableDatePicker';
import { LazyDatePickerProps } from './types';

const DatePicker: React.FC<LazyDatePickerProps> = ({
  value,
  label,
  onChange = () => {},
  locale = 'en',
  format,
  useTimezone = false,
  endOfDay = false,
  model,
  name,
  placeholder,
  labelToday,
  labelClear,
  hideLabel,
  className,
  onBlur,
  disabled = false,
  hasErrors = false,
  errorMessage = '',
  showCalendarIcon = true,
  showClearFieldIcon = true,
  required = false,
  inputRef,
  autoComplete = 'off',
  inputClassName,
  innerLabel,
}) => {
  const { dateFormat: defaultDateFormat = 'DD/MM/YYYY' } =
    useAtomValue<ClientSettings>(settingsAtom);
  const dateFormat = (format || defaultDateFormat).toUpperCase();
  const [inputValue, setInputValue] = useState<moment.Moment | null>(null);

  useEffect(() => {
    const timestampMs = removeOffset(
      typeof value === 'string' ? parseInt(value, 10) : value || 0,
      useTimezone
    );
    if (timestampMs) {
      const displayDate = !useTimezone ? moment(timestampMs).local() : moment(timestampMs).utc();
      setInputValue(displayDate);
    } else {
      setInputValue(null);
    }
  }, [value, useTimezone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;

    if (!typedValue) {
      onChange(null);
      return;
    }

    const parsedDate = moment(typedValue, dateFormat, true);
    setInputValue(parsedDate);

    if (parsedDate.isValid()) {
      const withOffset = addOffset(parsedDate.valueOf(), endOfDay, useTimezone);
      if (withOffset) {
        setInputValue(withOffset);
        onChange(withOffset.valueOf() / 1000);
      }
    }
  };

  const formattedDate = formatDate(inputValue, dateFormat, useTimezone);

  return (
    <div>
      <LazyDatePicker
        label={label}
        language={locale}
        dateFormat={dateFormat.toLowerCase()}
        value={formattedDate}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        labelToday={labelToday}
        labelClear={labelClear}
        name={model || name}
        hideLabel={hideLabel}
        className={className}
        disabled={disabled}
        hasErrors={hasErrors}
        errorMessage={errorMessage}
        useTimezone={useTimezone}
        endOfDay={endOfDay}
        showCalendarIcon={showCalendarIcon}
        showClearFieldIcon={showClearFieldIcon}
        required={required}
        inputRef={inputRef}
        autoComplete={autoComplete}
        innerLabel={innerLabel}
        inputClassName={inputClassName}
      />
    </div>
  );
};

export { DatePicker };
