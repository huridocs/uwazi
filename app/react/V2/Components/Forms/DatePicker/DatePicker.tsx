import React, { ReactNode, useState, useEffect, useRef } from 'react';
import moment from 'moment-timezone';
import { Translate } from 'app/I18N';
import { removeOffset, addOffset, defaultDateFormat } from './dateUtils';
import { DatePickerComponent } from './DatePickerComponent';

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
  disabled?: boolean;
  hasErrors?: boolean;
  errorMessage?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  label,
  onChange = () => { },
  locale = 'en',
  format = defaultDateFormat,
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
  disabled = false,
  hasErrors = false,
  errorMessage = '',
}) => {
  const dateFormat = format.toUpperCase();
  const [inputValue, setInputValue] = useState('');
  const datePickerRef = useRef<{ setValue: (val: string) => void }>(null);

  useEffect(() => {
    const date = removeOffset(useTimezone, value, dateFormat);
    if (date) {
      setInputValue(date.format(dateFormat));
      datePickerRef.current?.setValue(date.format(dateFormat));
    } else {
      setInputValue('');
      datePickerRef.current?.setValue('');
    }
  }, [value, useTimezone, dateFormat]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    setInputValue(typedValue);

    if (!typedValue) {
      onChange(null);
      return;
    }

    const parsedDate = moment(typedValue, dateFormat, true);
    if (parsedDate.isValid()) {
      const withOffset = addOffset(useTimezone, endOfDay, typedValue, dateFormat);
      if (withOffset) {
        const formattedDate = withOffset.format(dateFormat);
        setInputValue(formattedDate);
        onChange(withOffset.valueOf() / 1000);
      }
    }
  };

  return (
    <div>
      <DatePickerComponent
        ref={datePickerRef}
        label={label || <Translate translationKey="property date">Date</Translate>}
        language={locale}
        dateFormat={dateFormat.toLowerCase()}
        value={inputValue}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        labelToday={labelToday}
        labelClear={labelClear}
        name={model}
        hideLabel={hideLabel}
        className={className}
        clearFieldAction={clearFieldAction}
        disabled={disabled}
        hasErrors={hasErrors}
        errorMessage={errorMessage}
        useTimezone={useTimezone}
        endOfDay={endOfDay}
      />
    </div>
  );
};

export { DatePicker };
