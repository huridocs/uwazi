import moment, { Moment } from 'moment-timezone';
import type { DatepickerProps as FlowbiteDatepickerProps } from 'flowbite-react';
import { ChangeEventHandler } from 'react';
import { t } from 'app/I18N';

export const defaultDateFormat = 'DD-MM-YYYY';

export const removeOffset = (
  useTimezone: boolean,
  value: string | number | null | undefined,
  dateFormat?: string
): Moment | null => {
  if (!value) return null;
  const milliseconds = typeof value === 'number' ? value * 1000 : moment(value).valueOf();
  const newValue = moment.utc(milliseconds);

  if (!useTimezone) {
    newValue.subtract(moment(milliseconds).utcOffset(), 'minutes');
  }

  return newValue;
};

export const addOffset = (
  useTimezone: boolean,
  endOfDay: boolean,
  value: string,
  dateFormat: string
): Moment | null => {
  const newValue = moment.utc(value, dateFormat, true);
  if (!newValue.isValid()) {
    return null;
  }

  if (!useTimezone) {
    newValue.add(moment(value).utcOffset(), 'minutes');
  }

  if (endOfDay) {
    const method = useTimezone ? newValue.local() : newValue.utc();
    method.endOf('day');
  }

  return newValue;
};

export interface DatePickerProps extends FlowbiteDatepickerProps {
  dateFormat?: string;
  language: string;
  labelToday?: string;
  labelClear?: string;
  id?: string;
  label?: string | React.ReactNode;
  disabled?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  hasErrors?: boolean;
  errorMessage?: string | React.ReactNode;
  value?: string | number;
  inputClassName?: string;
  autoComplete?: 'on' | 'off';
  name?: string;
  clearFieldAction?: () => any;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  useTimezone?: boolean;
  endOfDay?: boolean;
}

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

export const datePickerOptionsByLocale = (language: string, labelToday: string, labelClear: string, dateFormat: string = defaultDateFormat) => {
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
