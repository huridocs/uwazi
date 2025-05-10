import React, { ChangeEventHandler } from 'react';
import moment from 'moment-timezone';
import { Translate, t } from 'app/I18N';
import { LazyDateRangePicker } from './loadableDatePicker';

interface DateRangeValue {
  from: string | number | null;
  to: string | number | null;
}

interface DateRangeProps {
  value?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
  locale?: string;
  format?: string;
  useTimezone?: boolean;
  model?: string;
  className?: string;
  labelToday?: string;
  labelClear?: string;
  placeholderStart?: string;
  placeholderEnd?: string;
  onFromDateSelected?: ChangeEventHandler<HTMLInputElement>;
  onToDateSelected?: ChangeEventHandler<HTMLInputElement>;
  label?: React.ReactElement;
  hasErrors?: boolean;
  onClear?: (field: 'from' | 'to') => void;
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

const DateRange: React.FC<DateRangeProps> = ({ 
  value = { from: null, to: null }, 
  onChange = () => {}, 
  locale = 'en', 
  format = 'YYYY-MM-DD', 
  useTimezone = false,
  model,
  label,
  hasErrors,
  onClear
}) => {
  const { from, to } = value;

  const handleFromDateSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      onChange({ ...value, from: null });
    } else {
      const newValue = addOffset(useTimezone, false, e.target.value);
      onChange({ ...value, from: newValue });
    }
  };

  const handleToDateSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      onChange({ ...value, to: null });
    } else {
      const newValue = addOffset(useTimezone, true, e.target.value);
      onChange({ ...value, to: newValue });
    }
  };

  const handleClear = (field: 'from' | 'to') => {
    onChange({ ...value, [field]: null });
  };

  return (
    <div>
      <LazyDateRangePicker
        label={<Translate translationKey="property daterange">Date Range</Translate>}
        language={locale}
        dateFormat={format}
        value={{from: removeOffset(useTimezone, from) || '', to: removeOffset(useTimezone, to) || ''}}
        onFromDateSelected={handleFromDateSelected}
        onToDateSelected={handleToDateSelected}
        onClear={handleClear}
        placeholderStart={t('System', 'From', null, false)}
        placeholderEnd={t('System', 'To', null, false)}
        labelToday={t('System', 'Today', null, false)}
        labelClear={t('System', 'Clear', null, false)}
        name={model}
        hideLabel={false}
      />
    </div>
  );
};

export { DateRange }; 