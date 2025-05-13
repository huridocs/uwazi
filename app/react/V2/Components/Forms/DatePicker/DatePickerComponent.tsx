import React, { useEffect, Ref, ChangeEventHandler, useRef, useImperativeHandle } from 'react';
import moment from 'moment';
import { isNumber } from 'lodash';
import { DatepickerProps as FlowbiteDatepickerProps } from 'flowbite-react';
//Module has no types
//@ts-ignore
import Datepicker from 'flowbite-datepicker/Datepicker';
import 'flowbite/dist/flowbite.min.css';
import uniqueID from 'shared/uniqueID';
import { debounce } from 'app/utils';
import { t } from 'app/I18N';
import { Label } from '../Label';
import { InputError } from '../InputError';

interface DatePickerProps extends FlowbiteDatepickerProps {
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

const datePickerOptionsByLocale = (language: string, labelToday: string, labelClear: string) => {
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
    format: 'dd-mm-yyyy',
    titleFormat: titleFormat(language),
    rtl: isRTL,
  };
};

const validateLocale = (language: string) => {
  try {
    Intl.getCanonicalLocales(language);
    return language;
  } catch (_err) {
    return 'en';
  }
};

const DatePickerComponent = React.forwardRef(
  (
    {
      labelToday = 'Today',
      labelClear = 'Clear',
      label = '',
      disabled = false,
      placeholder,
      hasErrors = false,
      errorMessage = '',
      value = '',
      autoComplete = 'off',
      id = uniqueID(),
      language = 'en',
      dateFormat = 'YYYY-MM-DD',
      hideLabel = true,
      inputClassName = '',
      className = '',
      name = 'date',
      onChange = () => {},
      onBlur = () => {},
      clearFieldAction = () => {},
      useTimezone = false,
      endOfDay = false,
    }: DatePickerProps,
    forwardedRef: Ref<HTMLInputElement | null>
  ) => {
    const ref: React.MutableRefObject<HTMLInputElement | null> = useRef(null);
    useImperativeHandle(forwardedRef, () => ref.current);

    const datePickerFormat = dateFormat.toLowerCase();
    const fieldStyles = !(hasErrors || errorMessage)
      ? `${inputClassName || ''} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`
      : `${inputClassName || ''} border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700`;

    const instance = useRef<Datepicker | null>(null);
    const locale = validateLocale(language);

    const debouncedOnChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue !== value && newValue.length === 10) {
        onChange(e);
      }
    }, 1000);

    const debouncedOnBlur = debounce((e: React.FocusEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue && !moment(newValue, dateFormat, true).isValid()) {
        if (newValue === '') {
          onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
        }
      }
      onBlur(e);
    }, 1000);

    useEffect((): (() => void) => {
      Object.assign(Datepicker.locales, {
        [locale]: {
          ...datePickerOptionsByLocale(locale, labelToday, labelClear),
          format: datePickerFormat,
        },
      });
      instance.current = new Datepicker(ref.current, {
        container: '#tw-container',
        language: locale,
        labelToday,
        labelClear,
        locales: { [locale]: Datepicker.locales[locale] },
        todayBtnMode: 1,
        todayBtn: true,
        clearBtn: true,
        autohide: true,
        clearFieldAction,
        format: datePickerFormat,
      });
      return () => (instance?.current?.hide instanceof Function ? instance?.current?.hide() : {});
    }, []);

    useEffect(() => {
      if (instance?.current && ref?.current) {
        let newValue = isNumber(value) ? value.toString() : value || '';
        if (useTimezone && isNumber(value)) {
          const date = moment.unix(Number(value));
          newValue = date.format('DD-MM-YYYY');
        }
        if (ref.current.value !== newValue) {
          ref.current.value = newValue;
        }
      }
    }, [instance, value, useTimezone]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (ref.current) {
        ref.current.value = newValue;
      }
      debouncedOnChange(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Backspace', 'Tab', '-', '/'];
      const isNumber = /^[0-9]$/.test(e.key);
      const isAllowedKey = allowedKeys.includes(e.key);
      
      if (!isNumber && !isAllowedKey) {
        e.preventDefault();
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      debouncedOnBlur(e);
    };

    return (
      <div className="tw-content">
        <div id="tw-container" className={`absolute z-50 ${className} tw-datepicker w-full`} />
        <div className="tw-datepicker">
          <Label htmlFor={id} hideLabel={hideLabel} hasErrors={Boolean(hasErrors || errorMessage)}>
            {label}
          </Label>
          <div className="relative w-full">
            <input
              id={id}
              // @ts-ignore
              datepicker="true"
              datepicker-autohide="true"
              datepicker-buttons="true"
              datepicker-autoselect-today="true"
              type="text"
              lang={locale}
              onChange={handleChange}
              onSelect={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              name={name}
              ref={ref}
              disabled={disabled}
              defaultValue={value}
              className={`block flex-1 w-full text-sm ${fieldStyles} disabled:text-gray-500`}
              placeholder={placeholder || dateFormat}
              autoComplete={autoComplete}
            />
            <div className="flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none">
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          {errorMessage && <InputError>{errorMessage}</InputError>}
        </div>
      </div>
    );
  }
);

export type { DatePickerProps };
export { DatePickerComponent, datePickerOptionsByLocale, validateLocale };
