import React, { ReactNode, useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import moment from 'moment-timezone';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom } from 'app/V2/atoms';
import { LazyDateRangePicker } from './loadableDatePicker';
import { removeOffset, addOffset, formatDate } from './dateUtils';

interface DateRangeProps {
  label?: ReactNode;
  labelToday?: string;
  labelClear?: string;
  disabled?: boolean;
  hasErrors?: boolean;
  value?: { from: string | number | null; to: string | number | null };
  onChange?: (val: { from: number | null; to: number | null }) => void;
  locale?: string;
  format?: string;
  useTimezone?: boolean;
  endOfDay?: boolean;
  model?: string;
  name?: string;
  placeholderStart?: string;
  placeholderEnd?: string;
  hideLabel?: boolean;
  className?: string;
  onBlur?: any;
  onClear?: any;
  errorMessage?: string;
  required?: boolean;
  fromInputRef?: React.RefObject<HTMLInputElement>;
  toInputRef?: React.RefObject<HTMLInputElement>;
}

const DateRange: React.FC<DateRangeProps> = ({
  value,
  label,
  labelToday = 'Today',
  labelClear = 'Clear',
  disabled = false,
  hasErrors = false,
  onChange = () => { },
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
      onChange({ from: withOffset.valueOf() / 1000, to: toSeconds });
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

    const withOffset = addOffset(parsedDate.valueOf(), useTimezone, endOfDay);
    if (withOffset) {
      onChange({ from: fromSeconds, to: withOffset.valueOf() / 1000 });
      setToInputValue(withOffset);
    }
  };

  const formattedFrom = formatDate(fromInputValue, dateFormat, useTimezone);
  const formattedTo = formatDate(toInputValue, dateFormat, useTimezone);

  return (
    <div className="date-ra ge">
      <div className="date-ra ge-from">
        <LazyDateRangePicker
          language={locale}
          dateFormat={dateFormat.toLowerCase()}
          useTimezone={useTimezone}
          endOfDay={endOfDay}
          hideLabel={hideLabel}
          className={className}
          model={model || name}
          value={{ from: formattedFrom, to: formattedTo }}
          label={label}
          labelToday={labelToday}
          labelClear={labelClear}
          placeholderStart={placeholderStart}
          placeholderEnd={placeholderEnd}
          disabled={disabled}
          hasErrors={hasErrors}
          errorMessage={errorMessage}
          onFromDateSelected={handleFromChange}
          onToDateSelected={handleToChange}
          onBlur={onBlur}
          required={required}
          fromInputRef={fromInputRef}
          toInputRef={toInputRef}
        />
      </div>
    </div>
  );
};

export { DateRange };
