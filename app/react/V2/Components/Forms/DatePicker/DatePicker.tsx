import React from 'react';
import moment from 'moment-timezone';
import { Translate, t } from 'app/I18N';
import { LazyDatePicker } from './loadableDatePicker';

interface DatePickerProps {
  label?: string;
  value?: string | number | null;
  onChange: (value: number | null) => void;
  locale?: string;
  format?: string;
  labelToday?: string;
  labelClear?: string;
  useTimezone?: boolean;
  endOfDay?: boolean;
  model?: string;
  placeholder?: string;
  hideLabel?: boolean;
  className?: string;
  onBlur?: any,
  clearFieldAction?: any,
}

const removeOffset = (useTimezone: boolean, value: string | number | null | undefined): string | null => {
  if (!value) return null;
  
  const milliseconds = typeof value === 'number' ? value * 1000 : moment(value).valueOf();
  const newValue = moment.utc(milliseconds);

  if (!useTimezone) {
    newValue.subtract(moment(moment(milliseconds)).utcOffset(), 'minutes');
  }

  return newValue.locale('en').format('YYYY-MM-DD');
};

const addOffset = (useTimezone: boolean, endOfDay: boolean, value: string): number => {
  const newValue = moment.utc(value);

  if (!useTimezone) {
    newValue.add(moment(value).utcOffset(), 'minutes');
  }

  if (endOfDay) {
    const method = useTimezone ? newValue.local() : newValue.utc();
    method.endOf('day');
  }

  return parseInt(newValue.locale('en').format('X'), 10);
};

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  label,
  onChange,
  locale = 'en',
  format = 'YYYY-MM-DD',
  useTimezone = false,
  endOfDay = false,
  model,
  placeholder,
  labelToday,
  labelClear,
  hideLabel,
  className,
  onBlur,
  clearFieldAction,
}) => {
  const datePickerValue = removeOffset(useTimezone, value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      onChange(null);
    } else {
      const newValue = addOffset(useTimezone, endOfDay, e.target.value);
      onChange(newValue);
    }
  };

  return (
    <div>
      <LazyDatePicker
        // label={<Translate translationKey="property date">Date</Translate>}
        label={label}
        language={locale}
        dateFormat={format}
        value={datePickerValue || ''}
        onChange={handleChange}
        placeholder={placeholder}
        labelToday={labelToday}
        labelClear={labelClear}
        name={model}
        hideLabel={false}
      />
    </div>
  );
};

export {DatePicker}; 