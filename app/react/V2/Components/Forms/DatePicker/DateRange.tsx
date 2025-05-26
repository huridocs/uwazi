import React, { ReactNode, useState, useEffect } from 'react';
import moment from 'moment-timezone';
import { removeOffset, addOffset, defaultDateFormat } from './dateUtils';
import { LazyDateRangePicker } from './loadableDatePicker';

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
  required?: boolean;
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
    onClear,
    clearFieldAction,
    errorMessage,
    required = false,
  } = props;
  const dateFormat = (format || defaultDateFormat).toUpperCase();
  const [fromInputValue, setFromInputValue] = useState<moment.Moment | null>(null);
  const [toInputValue, setToInputValue] = useState<moment.Moment | null>(null);

  useEffect(() => {
    const fromDate = removeOffset(useTimezone, value?.from ?? null, dateFormat);
    const toDate = removeOffset(useTimezone, value?.to ?? null, dateFormat);

    if (fromDate) {
      setFromInputValue(fromDate);
    } else {
      setFromInputValue(null);
    }
    if (toDate) {
      setToInputValue(toDate);
    } else {
      setToInputValue(null);
    }
  }, [value, useTimezone, dateFormat]);

  // eslint-disable-next-line max-statements
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    setFromInputValue(moment(typedValue, dateFormat, true));

    const previousToValue = toInputValue?.valueOf() ? toInputValue.valueOf() / 1000 : null;

    if (!typedValue) {
      onChange({ from: null, to: previousToValue });
      return;
    }

    const parsedDate = moment(typedValue, dateFormat, true);
    if (parsedDate.isValid()) {
      const withOffset = addOffset(useTimezone, endOfDay, typedValue, dateFormat);
      if (withOffset) {
        const formattedDate = withOffset.format(dateFormat);
        onChange({ from: withOffset.valueOf() / 1000, to: previousToValue });
        setFromInputValue(withOffset);
      }
    }
  };

  // eslint-disable-next-line max-statements
  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    setToInputValue(moment(typedValue, dateFormat, true));
    const previousFromValue = fromInputValue?.valueOf() ? fromInputValue.valueOf() / 1000 : null;
    if (!typedValue) {
      onChange({ from: previousFromValue, to: null });
      return;
    }

    const parsedDate = moment(typedValue, dateFormat, true);
    if (parsedDate.isValid()) {
      const withOffset = addOffset(useTimezone, endOfDay, typedValue, dateFormat);
      if (withOffset) {
        const formattedDate = withOffset.format(dateFormat);
        onChange({ from: previousFromValue, to: withOffset.valueOf() / 1000 });
        setToInputValue(withOffset);
      }
    }
  };

  return (
    <div className="date-range">
      <div className="date-range-from">
        <LazyDateRangePicker
          language={locale}
          dateFormat={dateFormat.toLowerCase()}
          useTimezone={useTimezone}
          endOfDay={endOfDay}
          hideLabel={hideLabel}
          className={className}
          model={model || name}
          value={{ from: fromInputValue?.valueOf() ?? null, to: toInputValue?.valueOf() ?? null }}
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
          required={required}
        />
      </div>
    </div>
  );
};

export { DateRange };