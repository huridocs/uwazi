import React, { ReactNode, useState, useEffect } from 'react';
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
  clearFieldAction,
  errorMessage,
}) => {
  const dateFormat = (format || 'YYYY/MM/DD').toUpperCase();
  const fromDate = removeOffset(useTimezone, value?.from);
  const toDate = removeOffset(useTimezone, value?.to);


  const handleFromChange = (newValue: number | null) => {
    if (newValue) {
      onChange({ from: removeOffset(useTimezone, newValue)?.valueOf() || '', to: value?.to || null });
    } else {
      onChange({ from: newValue, to: value?.to || null });
    }
  };

  const handleToChange = (newValue: number | null) => {
    if (newValue) {
      onChange({ from: value?.from || null, to: removeOffset(useTimezone, newValue)?.valueOf() || '' });
    } else {
      onChange({ from: value?.from || null, to: newValue });
    }
  };

  return (
    <div className="date-range">
      <div className="date-range-from">
        <LazyDateRangePicker
          language={locale}
          dateFormat={format}
          useTimezone={useTimezone}
          endOfDay={endOfDay}
          hideLabel={hideLabel}
          className={className}
          model={model}
          value={value}
          label={label || <Translate translationKey="property daterange" />}
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