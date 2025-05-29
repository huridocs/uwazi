import moment from 'moment-timezone';
import { t } from 'app/I18N';

export const removeOffset = (value: number, useTimezone: boolean) => {
  let datePickerValue = null;
  const miliseconds = value * 1000;
  if (value) {
    const newValue = moment.utc(miliseconds);

    if (!useTimezone) {
      // in order to get the system offset for the specific date we
      // need to create a new not UTC moment object with the original timestamp
      newValue.subtract(moment(moment(miliseconds)).utcOffset(), 'minutes');
    }

    datePickerValue = parseInt(newValue.locale('en').format('x'), 10);
  }

  return datePickerValue;
};

export const addOffset = (value: number, useTimezone: boolean, endOfDay: boolean) => {
  const newValue = moment.utc(value);

  if (!useTimezone) {
    // in order to get the proper offset moment has to be initialized with the actual date
    // without this you always get the "now" moment offset
    newValue.add(moment(value).utcOffset(), 'minutes');
  }

  if (endOfDay) {
    const method = useTimezone ? newValue.local() : newValue.utc();
    method.endOf('day');
  }

  return newValue;
};

const titleFormat = (locale: string) => {
  switch (locale) {
    case 'hu':
      return 'y. MM';
    case 'ja':
      return 'y年mm月';
    case 'ko':
      return 'y년mm월';
    case 'zh-CN':
      return 'y年mm月';
    default:
      return 'MM y';
  }
};

export const datePickerOptionsByLocale = (
  language: string,
  labelToday: string,
  labelClear: string,
  dateFormat: string
) => {
  const localeData = moment.localeData(language);
  const isRTL = ['ar', 'dv', 'ha', 'he', 'ks', 'ku', 'ps', 'fa', 'ur', 'yi'].includes(language);
  return {
    days: localeData.weekdays(),
    daysShort: localeData.weekdaysShort(),
    daysMin: localeData.weekdaysMin(),
    months: localeData.months(),
    monthsShort: localeData.monthsShort(),
    today: labelToday,
    monthsTitle: t('System', 'Months', null, false),
    clear: labelClear,
    weekStart: localeData.firstDayOfWeek(),
    format: dateFormat,
    titleFormat: titleFormat(language),
    rtl: isRTL,
  };
};

export const validateLocale = (language: string) => {
  try {
    Intl.getCanonicalLocales(language);
    return language;
  } catch (_err) {
    return 'en';
  }
};

export interface DatePickerProps {
  id?: string;
  model?: string;
  name?: string;
  value?: string | number;
  autoComplete?: 'on' | 'off';
  language?: string;
  dateFormat?: string;
  hideLabel?: boolean;
  inputClassName?: string;
  className?: string;
  labelToday?: string;
  labelClear?: string;
  label?: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
  hasErrors?: boolean;
  errorMessage?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  useTimezone?: boolean;
  endOfDay?: boolean;
  showCalendarIcon?: boolean;
  showClearFieldIcon?: boolean;
  required?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export interface DateRangePickerProps extends Omit<DatePickerProps, 'value'> {
  language: string;
  dateFormat?: string;
  hideLabel?: boolean;
  className?: string;
  model?: string;
  value?: {
    from: string | number | null;
    to: string | number | null;
  };
  onSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholderStart?: string;
  placeholderEnd?: string;
  onFromDateSelected?: any;
  onToDateSelected?: any;
  disabled?: boolean;
  hasErrors?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  showCalendarIcon?: boolean;
  showClearFieldIcon?: boolean;
  required?: boolean;
  fromInputRef?: React.RefObject<HTMLInputElement>;
  toInputRef?: React.RefObject<HTMLInputElement>;
}

export const formatDate = (
  value: moment.Moment | null,
  dateFormat: string,
  useTimezone: boolean
) => {
  if (!value) return '';
  if (useTimezone) return value.clone().utc().format(dateFormat);
  return value.clone().local().format(dateFormat);
};

export const ALLOWED_KEYS = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Delete',
  'Backspace',
  'Tab',
  '-',
  '/',
];

export const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const isNumber = /^[0-9]$/.test(e.key);
  const isAllowedKey = ALLOWED_KEYS.includes(e.key);

  if (!isNumber && !isAllowedKey) {
    e.preventDefault();
  }
};

export const getInputClassName = (
  inputClassName: string,
  hasErrors: boolean,
  errorMessage?: string
) => `
  block w-full text-sm h-8 rounded-lg pl-10 pr-8
  placeholder-opacity-100 placeholder-gray-500
  ${inputClassName || ''}
  ${
    hasErrors || errorMessage
      ? 'border-2 border-red-300 text-red-900 bg-red-50 placeholder-red-700 focus:ring-2 focus:ring-red-400 focus:border-red-400 hover:border-red-400'
      : 'bg-gray-50 border border-gray-300 text-gray-900 hover:border-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400'
  }
`;
