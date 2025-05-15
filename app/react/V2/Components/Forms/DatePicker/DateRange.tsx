import React, { ReactNode, useState, useEffect } from 'react';
import moment, { Moment } from 'moment-timezone';
import { Translate } from 'app/I18N';
import { LazyDateRangePicker } from './loadableDatePicker';
import { removeOffset, addOffset } from './dateUtils';

interface DateRangeProps {
  label?: ReactNode;
  labelToday?: string;
  labelClear?: string;
  value?: { from: string | number | null; to: string | number | null };
  onChange?: (value: { from: string | number | null; to: string | number | null }) => void;
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
  clearFieldAction?: any;
}

const DateRange: React.FC<DateRangeProps> = ({
  value,
  label,
  labelToday='Today',
  labelClear='Clear',
  onChange = () => {},
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
  clearFieldAction,
}) => {
  const dateFormat = format.toUpperCase();
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const fromDate = removeOffset(useTimezone, value?.from);
  const toDate = removeOffset(useTimezone, value?.to);

  useEffect(() => {
    if (fromDate) {
      setFromValue(fromDate.locale(locale).format(dateFormat));
    }
    if (toDate) {
      setToValue(toDate.locale(locale).format(dateFormat));
    }
  }, [fromDate, toDate, dateFormat, locale]);

  const handleFromChange = (newValue: number | null) => {
    onChange({ from: newValue, to: value?.to || null });
  };

  const handleToChange = (newValue: number | null) => {
    onChange({ from: value?.from || null, to: newValue });
  };

  const handleFromBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const timestamp = addOffset(useTimezone, endOfDay, e.target.value, dateFormat);
      if (timestamp !== null) {
        handleFromChange(timestamp.valueOf());
        setFromValue(timestamp.locale(locale).format(dateFormat));
      } else {
        setFromValue(fromDate?.locale(locale).format(dateFormat) || '');
      }
    }
    onBlur?.(e);
  };

  const handleToBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const timestamp = addOffset(useTimezone, endOfDay, e.target.value, dateFormat);
      if (timestamp !== null) {
        debugger;
        handleToChange(timestamp.valueOf());
        setToValue(timestamp.locale(locale).format(dateFormat));
      } else {
        setToValue(toDate?.locale(locale).format(dateFormat) || '');
      }
    }
    onBlur?.(e);
  };

  return (
    <div className="date-range">
      <div className="date-range-from">
        <LazyDateRangePicker
          label={label || <Translate translationKey="property date from">From</Translate>}
          value={{ from: value?.from || null, to: value?.to || null }}
          onFromDateSelected={handleFromChange}
          onToDateSelected={handleToChange}
          placeholderStart={placeholderStart}
          placeholderEnd={placeholderEnd}
          onBlur={handleFromBlur}
          language={locale}
          dateFormat={format}
          useTimezone={useTimezone}
          endOfDay={endOfDay}
          model={model ? `${model}.from` : undefined}
          placeholder={placeholderStart}
          hideLabel={hideLabel}
          className={className}
          clearFieldAction={clearFieldAction}
        />
      </div>
    </div>
  );
};

export { DateRange }; 