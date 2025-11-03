import React, { useEffect, Ref, useRef, useImperativeHandle } from 'react';
import { Info } from 'luxon';
//Module has no types
//@ts-ignore
import Datepicker from 'flowbite-datepicker/Datepicker';
import 'flowbite/dist/flowbite.min.css';
import uniqueID from 'shared/uniqueID';
import { t } from 'app/I18N';
import { Label } from '../Label';
import { InputError } from '../InputError';

interface DatePickerProps {
  dateFormat?: string;
  language: string;
  labelToday: string;
  labelClear: string;
  id?: string;
  label?: string | React.ReactNode;
  disabled?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  hasErrors?: boolean;
  errorMessage?: string | React.ReactNode;
  value?: number;
  inputClassName?: string;
  autoComplete?: 'on' | 'off';
  name?: string;
  clearFieldAction?: () => any;
  onChange?: (timestamp: number | null) => void;
  onBlur?: (timestamp: number | null) => void;
  className?: string;
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
  const isRTL = ['ar', 'dv', 'ha', 'he', 'ks', 'ku', 'ps', 'fa', 'ur', 'yi'].includes(language);
  const locale = language || 'en';

  return {
    days: Info.weekdays('long', { locale }),
    daysShort: Info.weekdays('short', { locale }),
    daysMin: Info.weekdays('narrow', { locale }),
    months: Info.months('long', { locale }),
    monthsShort: Info.months('short', { locale }),
    today: labelToday,
    monthsTitle: t('System', 'Months', null, false),
    clear: labelClear,
    weekStart: Info.getStartOfWeek({ locale }) - 1, // Luxon returns 1-7, flowbite expects 0-6
    format: 'dd/mm/yyyy',
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
      labelToday,
      labelClear,
      label,
      disabled,
      placeholder,
      hasErrors,
      errorMessage,
      value,
      autoComplete,
      id = uniqueID(),
      language = 'en',
      dateFormat,
      hideLabel = true,
      inputClassName = '',
      className = '',
      name = '',
      onChange,
      clearFieldAction = () => {},
    }: DatePickerProps,
    forwardedRef: Ref<HTMLInputElement | null>
  ) => {
    const ref: React.MutableRefObject<HTMLInputElement | null> = useRef(null);
    useImperativeHandle(forwardedRef, () => ref.current);

    const fieldStyles = !(hasErrors || errorMessage)
      ? // eslint-disable-next-line max-len
        `${inputClassName || ''} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`
      : `${inputClassName || ''} border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700`;

    const instance = useRef<Datepicker | null>(null);
    const locale = validateLocale(language);

    useEffect(() => {
      const localeConfig = {
        ...datePickerOptionsByLocale(locale, labelToday, labelClear),
        ...(dateFormat && { format: dateFormat }),
      };
      Object.assign(Datepicker.locales, {
        [locale]: localeConfig,
      });

      const datepickerConfig = {
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
        ...(dateFormat && { format: dateFormat }),
      };

      instance.current = new Datepicker(ref.current, datepickerConfig);

      // Set initial value from timestamp - Flowbite accepts Date objects
      if (value) {
        instance.current.setDate(new Date(value));
      }

      // Listen to Flowbite's changeDate event which provides a Date object
      const el = ref.current;
      const changeHandler = (e: any) => {
        const date = e.detail?.date;
        const timestamp = date ? date.getTime() : null;
        onChange?.(timestamp);
      };

      el?.addEventListener('changeDate', changeHandler);

      return () => {
        el?.removeEventListener('changeDate', changeHandler);
        if (instance?.current?.hide instanceof Function) instance?.current?.hide();
      };
    }, [id, locale, labelToday, labelClear, dateFormat, clearFieldAction, value, onChange]);

    useEffect(() => {
      if (instance?.current) {
        if (value) {
          instance.current.setDate(new Date(value));
        } else {
          instance.current.setDate({ clear: true });
        }
      }
    }, [instance, value]);

    return (
      <div className="tw-content">
        <div id="tw-container" className={`absolute z-50 ${className} tw-datepicker`} />
        <div className="tw-datepicker">
          <Label htmlFor={id} hideLabel={hideLabel} hasErrors={Boolean(hasErrors || errorMessage)}>
            {label}
          </Label>
          <div className="relative w-72">
            <input
              id={id}
              // @ts-ignore
              datepicker="true"
              datepicker-autohide="true"
              datepicker-buttons="true"
              datepicker-autoselect-today="true"
              type="text"
              lang={locale}
              name={name}
              ref={ref}
              disabled={disabled}
              className={`block flex-1 w-full text-sm ${fieldStyles} disabled:text-gray-500`}
              placeholder={placeholder}
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

DatePickerComponent.defaultProps = {
  id: uniqueID(),
  label: '',
  disabled: false,
  hideLabel: true,
  placeholder: 'Select a date',
  hasErrors: false,
  errorMessage: '',
  value: undefined,
  inputClassName: '',
  className: '',
  autoComplete: 'off',
  name: 'datePicker',
  dateFormat: undefined,
  clearFieldAction: () => {},
  onChange: undefined,
  onBlur: undefined,
};

export type { DatePickerProps };
export { DatePickerComponent, datePickerOptionsByLocale, validateLocale };
