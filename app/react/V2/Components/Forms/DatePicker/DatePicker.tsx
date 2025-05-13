import React, { ReactNode, useState, useEffect } from 'react';
import moment, { Moment } from 'moment-timezone';
import { Translate, t } from 'app/I18N';
import { LazyDatePicker } from './loadableDatePicker';

interface DatePickerProps {
  label?: ReactNode;
  value?: string | number | null;
  onChange?: (value: number | null) => void;
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
  onBlur?: any;
  clearFieldAction?: any;
}

const removeOffset = (useTimezone: boolean, value: string | number | null | undefined): Moment | null => {
  if (!value) return null;
  
  const milliseconds = typeof value === 'number' ? value * 1000 : moment(value).valueOf();
  const newValue = moment.utc(milliseconds);

  if (!useTimezone) {
    newValue.subtract(moment(moment(milliseconds)).utcOffset(), 'minutes');
  }

  return newValue;
};

const addOffset = (useTimezone: boolean, endOfDay: boolean, value: string, dateFormat: string): Moment | null => {
  let parsedDate = moment(value, dateFormat, true);
  if (!parsedDate.isValid()) {
    parsedDate = moment(value);
  }
  if (!parsedDate.isValid()) {
    return null;
  }

  const newValue = moment.utc(parsedDate);

  if (!useTimezone) {
    newValue.add(moment(value).utcOffset(), 'minutes');
  }

  if (endOfDay) {
    const dateValue = useTimezone ? newValue.local() : newValue.utc();
    dateValue.endOf('day');
    return dateValue;
  }

  return newValue;
};

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  label,
  onChange = () => {},
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
  const dateFormat = format.toUpperCase();
  const [inputValue, setInputValue] = useState<string>('');
  const datePickerValue = removeOffset(useTimezone, value);

  useEffect(() => {
    if(datePickerValue) {
      setInputValue(datePickerValue?.locale?.(locale).format(dateFormat) || '');
    }
  }, [datePickerValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (!inputValue) {
      onChange(null);
      setInputValue('');
      return;
    }
    const newValue = addOffset(useTimezone, endOfDay, inputValue, dateFormat);
    if (newValue) {
      setInputValue(newValue.locale(locale).format(dateFormat));
      onChange(newValue.valueOf());
    } else {
      setInputValue(inputValue);
    }
  };

  // const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   const allowedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Backspace', 'Tab'];
  //   if (isNaN(Number(e.key)) && !allowedKeys.includes(e.key)) {
  //     e.preventDefault();
  //   }
  // };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newValue = removeOffset(useTimezone, e.target.value);
      const timestamp = addOffset(useTimezone, endOfDay, e.target.value, dateFormat);
      if (timestamp !== null) {
        onChange(timestamp.valueOf());
        setInputValue(timestamp?.locale?.(locale).format(dateFormat) || '');
      } else {
        setInputValue(datePickerValue?.locale?.(locale).format(dateFormat) || '');
      }
    }
    onBlur?.(e);
  };

  return (
    <div>
      <LazyDatePicker
        label={label || <Translate translationKey="property date">Date</Translate>}
        language={locale}
        dateFormat={dateFormat.toLowerCase()}
        value={inputValue}
        onChange={handleChange}
        // onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        labelToday={labelToday}
        labelClear={labelClear}
        name={model}
        hideLabel={hideLabel}
        className={className}
        clearFieldAction={clearFieldAction}
      />
    </div>
  );
};

export { DatePicker }; 