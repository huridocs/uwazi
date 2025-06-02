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
