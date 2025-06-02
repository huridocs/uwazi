import React, { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import moment from 'moment-timezone';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom } from 'app/V2/atoms';
import { LazyDateRangePicker } from './loadableDatePicker';
import { removeOffset, addOffset, formatDate } from './dateUtils';
import { DateRangePickerProps } from './types';

const DateRange: React.FC<DateRangePickerProps> = ({
  value,
  label,
  labelToday = 'Today',
  labelClear = 'Clear',
  disabled = false,
  hasErrors = false,
  onChange = () => {},
  locale = 'en',
  format,
  useTimezone = false,
  endOfDay = false,
  model,
  name,
  placeholderStart,
  placeholderEnd,
  hideLabel,
  className,
  onBlur,
  errorMessage,
  required = false,
  fromInputRef,
  toInputRef,
  showClearFieldIcon = true,
  horizontal = false,
}) => {
  const { dateFormat: defaultDateFormat = 'DD/MM/YYYY' } =
    useAtomValue<ClientSettings>(settingsAtom);
  const dateFormat = (format || defaultDateFormat).toUpperCase();

  const [fromInputValue, setFromInputValue] = useState<moment.Moment | null>(null);
  const [toInputValue, setToInputValue] = useState<moment.Moment | null>(null);

  useEffect(() => {
    const fromValue = typeof value?.from === 'string' ? parseInt(value.from, 10) : value?.from;
    const toValue = typeof value?.to === 'string' ? parseInt(value.to, 10) : value?.to;

    const fromTimestampMs = removeOffset(fromValue || 0, useTimezone);
    const toTimestampMs = removeOffset(toValue || 0, useTimezone);

    if (fromTimestampMs) {
      const fromDisplayDate = !useTimezone
        ? moment(fromTimestampMs).local()
        : moment(fromTimestampMs).utc();
      setFromInputValue(fromDisplayDate);
    } else {
      setFromInputValue(null);
    }

    if (toTimestampMs) {
      const toDisplayDate = !useTimezone
        ? moment(toTimestampMs).local()
        : moment(toTimestampMs).utc();
      setToInputValue(toDisplayDate);
    } else {
      setToInputValue(null);
    }
  }, [value, useTimezone]);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    const parsedDate = moment(typedValue, dateFormat, true);

    setFromInputValue(parsedDate.isValid() ? parsedDate : null);

    const toSeconds = toInputValue?.valueOf() ? toInputValue.valueOf() / 1000 : null;

    if (!typedValue || !parsedDate.isValid()) {
      onChange({ from: null, to: toSeconds });
      return;
    }

    const withOffset = addOffset(parsedDate.valueOf(), endOfDay, useTimezone);
    if (withOffset) {
      const fromSeconds = withOffset.valueOf() / 1000;
      onChange({ from: fromSeconds, to: toSeconds });
      setFromInputValue(withOffset);
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    const parsedDate = moment(typedValue, dateFormat, true);

    setToInputValue(parsedDate.isValid() ? parsedDate : null);

    const fromSeconds = fromInputValue?.valueOf() ? fromInputValue.valueOf() / 1000 : null;

    if (!typedValue || !parsedDate.isValid()) {
      onChange({ from: fromSeconds, to: null });
      return;
    }

    const withOffset = addOffset(parsedDate.valueOf(), endOfDay, useTimezone);
    if (withOffset) {
      const toSeconds = withOffset.valueOf() / 1000;
      onChange({ from: fromSeconds, to: toSeconds });
      setToInputValue(withOffset);
    }
  };

  const formattedFromDate = formatDate(fromInputValue, dateFormat, useTimezone);
  const formattedToDate = formatDate(toInputValue, dateFormat, useTimezone);

  return (
    <div className="date-range">
      <LazyDateRangePicker
        label={label}
        language={locale}
        dateFormat={dateFormat.toLowerCase()}
        model={model || name}
        value={{ from: formattedFromDate, to: formattedToDate }}
        onFromDateSelected={handleFromChange}
        onToDateSelected={handleToChange}
        onBlur={onBlur}
        placeholderStart={placeholderStart}
        placeholderEnd={placeholderEnd}
        labelToday={labelToday}
        labelClear={labelClear}
        hideLabel={hideLabel}
        className={className}
        disabled={disabled}
        hasErrors={hasErrors}
        errorMessage={errorMessage}
        useTimezone={useTimezone}
        endOfDay={endOfDay}
        showClearFieldIcon={showClearFieldIcon}
        required={required}
        fromInputRef={fromInputRef}
        toInputRef={toInputRef}
        horizontal={horizontal}
      />
    </div>
  );
};

export { DateRange };
