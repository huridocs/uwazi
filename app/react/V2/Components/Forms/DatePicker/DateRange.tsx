import React, { ReactNode, useState, useEffect } from 'react';
import moment, { Moment } from 'moment-timezone';
import { Translate } from 'app/I18N';
import { LazyDateRangePicker } from './loadableDatePicker';
import { removeOffset, addOffset } from './dateUtils';

interface DateRangeProps {
  label?: ReactNode;
  labelToday?: string;
  labelClear?: string;
  disabled?: boolean;
  hasErrors?: boolean;
  value?: { from: string | number | null; to: string | number | null };
  onChange?: any;
  locale?: string;
  format?: string;
  useTimezone?: boolean;
  endOfDay?: boolean;
  model?: string;
  placeholderStart?: string;
  placeholderEnd?: string;
  hideLabel?: boolean;
  className?: string;
  onBlur?: any;
  onClear?: any;
  clearFieldAction?: any;
  errorMessage?: string;
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
  format = 'YYYY-MM-DD',
  useTimezone = false,
  endOfDay = false,
  model,
  placeholderStart,
  placeholderEnd,
  hideLabel,
  className,
  onBlur,
  onClear,
  clearFieldAction,
  errorMessage,
}) => {
  const dateFormat = (format || 'YYYY/MM/DD').toUpperCase();
  const [fromInputValue, setFromInputValue] = useState('');
  const [toInputValue, setToInputValue] = useState('');
  const [fromRawDate, setFromRawDate] = useState<Moment | null>(null);
  const [toRawDate, setToRawDate] = useState<Moment | null>(null);

  useEffect(() => {
    const fromDate = removeOffset(useTimezone, value?.from);
    const toDate = removeOffset(useTimezone, value?.to);

    if (fromDate) {
      setFromRawDate(fromDate);
      setFromInputValue(fromDate.format(dateFormat));
    } else {
      setFromRawDate(null);
      setFromInputValue('');
    }
    if (toDate) {
      setToRawDate(toDate);
      setToInputValue(toDate.format(dateFormat));
    } else {
      setToRawDate(null);
      setToInputValue('');
    }
  }, [value, useTimezone, dateFormat]);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    setFromInputValue(typedValue);

    if (!typedValue) {
      setFromRawDate(null);
      onChange({ from: null, to: value?.to || null });
      return;
    }

    const parsedDate = moment(typedValue, dateFormat, true);
    if (parsedDate.isValid()) {
      const withOffset = addOffset(useTimezone, endOfDay, typedValue, dateFormat);
      if (withOffset) {
        setFromRawDate(withOffset);
        const formattedDate = withOffset.format(dateFormat);
        onChange({ from: withOffset.valueOf() / 1000, to: value?.to || null });
        setFromInputValue(formattedDate);
      }
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    setToInputValue(typedValue);

    if (!typedValue) {
      setToRawDate(null);
      onChange({ from: value?.from || null, to: null });
      return;
    }

    const parsedDate = moment(typedValue, dateFormat, true);
    if (parsedDate.isValid()) {
      const withOffset = addOffset(useTimezone, endOfDay, typedValue, dateFormat);
      if (withOffset) {
        setToRawDate(withOffset);
        const formattedDate = withOffset.format(dateFormat);
        onChange({ from: value?.from || null, to: withOffset.valueOf() / 1000 });
        setToInputValue(formattedDate);
      }
    }
  };

  return (
    <div className="date-range">
      <div className="date-range-from">
        <LazyDateRangePicker
          language={locale}
          dateFormat={dateFormat}
          useTimezone={useTimezone}
          endOfDay={endOfDay}
          hideLabel={hideLabel}
          className={className}
          model={model}
          value={{ from: fromInputValue, to: toInputValue }}
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
          onClear={onClear}
          clearFieldAction={clearFieldAction}
        />
      </div>
    </div>
  );
};

export { DateRange }; 