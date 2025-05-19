import React, { ReactNode, useState, useEffect } from 'react';
import moment from 'moment-timezone';
import { removeOffset, addOffset, defaultDateFormat } from './dateUtils';
import { DateRangePickerComponent } from './DateRangePickerComponent';

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
  name?: string;
  placeholderStart?: string;
  placeholderEnd?: string;
  hideLabel?: boolean;
  className?: string;
  onBlur?: any;
  onClear?: any;
  clearFieldAction?: any;
  errorMessage?: string;
}

const DateRange: React.FC<DateRangeProps> = (props) => {
  const {
    value,
    label,
    labelToday = 'Today',
    labelClear = 'Clear',
    disabled = false,
    hasErrors = false,
    onChange = () => { },
    locale = 'en',
    format = defaultDateFormat,
    useTimezone = false,
    endOfDay = false,
    model,
    name,
    placeholderStart,
    placeholderEnd,
    hideLabel,
    className,
    onBlur,
    onClear,
    clearFieldAction,
    errorMessage,
  } = props;
  const dateFormat = format.toUpperCase();
  const [fromInputValue, setFromInputValue] = useState('');
  const [toInputValue, setToInputValue] = useState('');

  useEffect(() => {
    const fromDate = removeOffset(useTimezone, value?.from ?? null, dateFormat);
    const toDate = removeOffset(useTimezone, value?.to ?? null, dateFormat);

    if (fromDate) {
      setFromInputValue(fromDate.format(dateFormat));
    } else {
      setFromInputValue('');
    }
    if (toDate) {
      setToInputValue(toDate.format(dateFormat));
    } else {
      setToInputValue('');
    }
  }, [value, useTimezone, dateFormat]);

  // eslint-disable-next-line max-statements
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    setFromInputValue(typedValue);

    if (!typedValue) {
      onChange({ from: null, to: value?.to || null });
      return;
    }

    const parsedDate = moment(typedValue, dateFormat, true);
    if (parsedDate.isValid()) {
      const withOffset = addOffset(useTimezone, endOfDay, typedValue, dateFormat);
      if (withOffset) {
        const formattedDate = withOffset.format(dateFormat);
        onChange({ from: withOffset.valueOf() / 1000, to: value?.to || null });
        setFromInputValue(formattedDate);
      }
    }
  };

  // eslint-disable-next-line max-statements
  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    setToInputValue(typedValue);

    if (!typedValue) {
      onChange({ from: value?.from || null, to: null });
      return;
    }

    const parsedDate = moment(typedValue, dateFormat, true);
    if (parsedDate.isValid()) {
      const withOffset = addOffset(useTimezone, endOfDay, typedValue, dateFormat);
      if (withOffset) {
        const formattedDate = withOffset.format(dateFormat);
        onChange({ from: value?.from || null, to: withOffset.valueOf() / 1000 });
        setToInputValue(formattedDate);
      }
    }
  };

  return (
    <div className="date-range">
      <div className="date-range-from">
        <DateRangePickerComponent
          language={locale}
          dateFormat={dateFormat.toLowerCase()}
          useTimezone={useTimezone}
          endOfDay={endOfDay}
          hideLabel={hideLabel}
          className={className}
          model={model || name}
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
          clearFieldAction={clearFieldAction}
        />
      </div>
    </div>
  );
};

export { DateRange }; 