import React, { ReactNode, useState, useEffect } from 'react';
import moment, { Moment } from 'moment-timezone';
import { Translate } from 'app/I18N';
import { LazyDatePicker } from './loadableDatePicker';
import { removeOffset, addOffset } from './dateUtils';

interface DatePickerProps {
  label?: ReactNode;
  value?: string | number | null;
  onChange?: (value: number | string | null) => void;
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
  const [inputValue, setInputValue] = useState('');
  const [rawDate, setRawDate] = useState<Moment | null>(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const date = removeOffset(useTimezone, value);
    if (date) {
      setRawDate(date);
      setInputValue(date.format(dateFormat));
      setIsValid(true);
    } else {
      setRawDate(null);
      setInputValue('');
      setIsValid(true);
    }
  }, [value, useTimezone, dateFormat]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    setInputValue(typedValue);

    if (!typedValue) {
      setRawDate(null);
      setIsValid(true);
      onChange(null);
      return;
    }

    const parsedDate = moment(typedValue, dateFormat, true);
    if (parsedDate.isValid()) {
      const withOffset = addOffset(useTimezone, endOfDay, typedValue, dateFormat);
      if (withOffset) {
        setRawDate(withOffset);
        setIsValid(true);
        const formattedDate = withOffset.format(dateFormat);
        onChange(withOffset.valueOf()/1000);
        setInputValue(formattedDate);
      }
    } else {
      setIsValid(false);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
