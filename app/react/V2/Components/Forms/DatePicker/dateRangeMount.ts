//@ts-ignore
import DateRangePicker from 'flowbite-datepicker/DateRangePicker';
//@ts-ignore
import Datepicker from 'flowbite-datepicker/Datepicker';
import { datePickerOptionsByLocale } from './DatePickerComponent.js';
import { dateFromTimestamp, hasBound } from './rangeTimestamp.js';

const applyFlowbiteLocale = (
  locale: string,
  labels: { today: string; clear: string },
  dateFormat?: string
) => {
  const format = dateFormat?.replace(/YYYY/g, 'yyyy').replace(/DD/g, 'dd').toLowerCase();
  Object.assign(Datepicker.locales, {
    [locale]: {
      ...datePickerOptionsByLocale(locale, labels.today, labels.clear),
      ...(format && { format }),
    },
  });
  return format;
};

const rangePickerConfig = (
  locale: string,
  format: string | undefined,
  inputs: Array<HTMLInputElement | null>
) => ({
  inputs,
  container: '#tw-container',
  language: locale,
  locales: { [locale]: Datepicker.locales[locale] },
  Mode: 1,
  todayBtnMode: 1,
  todayBtn: true,
  clearBtn: true,
  autohide: true,
  ...(format && { format }),
});

const timestampFromChange = (event: Event): number | null => {
  if (!(event instanceof CustomEvent)) return null;
  const { detail } = event;
  if (typeof detail !== 'object' || detail === null || !('date' in detail)) return null;
  const { date } = detail;
  return date instanceof Date ? date.getTime() : null;
};

const listenForDate = (
  element: HTMLInputElement | null,
  onSelected?: (timestamp: number | null) => void
) => {
  const handler = (event: Event) => {
    onSelected?.(timestampFromChange(event));
  };
  element?.addEventListener('changeDate', handler);
  return () => {
    element?.removeEventListener('changeDate', handler);
  };
};

const mountDateRange = ({
  container,
  fromEl,
  toEl,
  locale,
  labelToday,
  labelClear,
  dateFormat,
  from,
  to,
  onFromDateSelected,
  onToDateSelected,
}: {
  container: HTMLInputElement | null;
  fromEl: HTMLInputElement | null;
  toEl: HTMLInputElement | null;
  locale: string;
  labelToday: string;
  labelClear: string;
  dateFormat?: string;
  from?: number;
  to?: number;
  onFromDateSelected?: (timestamp: number | null) => void;
  onToDateSelected?: (timestamp: number | null) => void;
}) => {
  const format = applyFlowbiteLocale(locale, { today: labelToday, clear: labelClear }, dateFormat);
  const picker = new DateRangePicker(container, rangePickerConfig(locale, format, [fromEl, toEl]));
  if (hasBound(from) || hasBound(to)) {
    picker.setDates(dateFromTimestamp(from), dateFromTimestamp(to));
  }
  const stopFrom = listenForDate(fromEl, onFromDateSelected);
  const stopTo = listenForDate(toEl, onToDateSelected);
  return {
    picker,
    stop() {
      stopFrom();
      stopTo();
      if (picker?.hide instanceof Function) picker.hide();
    },
  };
};

export { mountDateRange };
