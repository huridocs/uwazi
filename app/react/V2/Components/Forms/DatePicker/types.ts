import { ReactNode, ChangeEvent, FocusEvent } from 'react';

export interface BaseDatePickerProps {
  id?: string;
  label?: ReactNode;
  labelToday?: string;
  labelClear?: string;
  placeholder?: string;
  locale?: string;
  language?: string;
  dateFormat?: string;
  format?: string;
  hideLabel?: boolean;
  className?: string;
  useTimezone?: boolean;
  disabled?: boolean;
  hasErrors?: boolean;
  errorMessage?: string;
  required?: boolean;
  showClearFieldIcon?: boolean;
  showCalendarIcon?: boolean;
  innerLabel?: string;
  inputClassName?: string;
  endOfDay?: boolean;
  model?: string;
  name?: string;
  autoComplete?: 'on' | 'off';
  inputRef?: React.RefObject<HTMLInputElement>;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
}

export interface DatePickerProps extends BaseDatePickerProps {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface LazyDatePickerProps extends Omit<BaseDatePickerProps, 'onChange' | 'value'> {
  onChange: (value?: string | number | null) => void;
  value?: string | number | null;
}

export interface DateRangePickerProps extends BaseDatePickerProps {
  value?: {
    from: string | number | null;
    to: string | number | null;
  };
  placeholderStart?: string;
  placeholderEnd?: string;
  fromInputRef?: React.RefObject<HTMLInputElement>;
  toInputRef?: React.RefObject<HTMLInputElement>;
  horizontal?: boolean;
  onChange?: (value: { from: number | null; to: number | null }) => void;
  onSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFromDateSelected?: any;
  onToDateSelected?: any;
  onClear?: any;
}

export interface DatePickerComponentProps extends Omit<DatePickerProps, 'onChange' | 'value'> {
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  value?: string | number | null;
}

export interface DateRangePickerComponentProps
  extends Omit<DateRangePickerProps, 'onChange' | 'value'> {
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  value?: {
    from: string | number | null;
    to: string | number | null;
  };
}
