import React, { useEffect, Ref, ChangeEventHandler, useRef } from 'react';
import moment from 'moment';
import { DatepickerProps as FlowbiteDatepickerProps } from 'flowbite-react';
//@ts-ignore
import Datepicker from 'flowbite-datepicker/Datepicker';
import 'flowbite/dist/flowbite.min.css';
import uniqueID from 'shared/uniqueID';
import { Label } from '../Label';
import { InputError } from '../InputError';

interface DatePickerProps extends FlowbiteDatepickerProps {
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
  value?: string | number;
  className?: string;
  autoComplete?: 'on' | 'off';
  preText?: string | React.ReactNode;
  name?: string;
  clearFieldAction?: () => any;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: ChangeEventHandler<HTMLInputElement>;
}

const datePickerOptionsByLocale = (language: string, labelToday: string, labelClear: string) => {
  const localeData = moment.localeData(language);
  return {
    days: localeData.weekdays(),
    daysShort: localeData.weekdaysShort(),
    daysMin: localeData.weekdaysMin(),
    months: localeData.months(),
    monthsShort: localeData.monthsShort(),
    today: labelToday,
    monthsTitle: 'Meses',
    clear: labelClear,
    weekStart: localeData.firstDayOfWeek(),
    format: 'dd/mm/yyyy',
  };
};

const DatePickerComponent = React.forwardRef(
  (
    {
      language = 'en',
      labelToday,
      labelClear,
      id = uniqueID(),
      label,
      disabled,
      placeholder,
      hasErrors,
      errorMessage,
      value,
      hideLabel = true,
      className = '',
      name = '',
      onChange = () => {},
      onBlur = () => {},
    }: DatePickerProps,
    ref: Ref<any>
  ) => {
    const fieldStyles = !(hasErrors || errorMessage)
      ? `${className} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`
      : `${className} border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700`;

    const instance = useRef<Datepicker | null>(null);

    useEffect(() => {
      const datePickerEl = document?.getElementById(id);
      Object.assign(Datepicker.locales, { [language]: datePickerOptionsByLocale });
      instance.current = new Datepicker(datePickerEl, {
        container: '#tw-container',
        language,
        locales: { language: datePickerOptionsByLocale },
        todayBtnMode: 1,
        todayBtn: true,
        clearBtn: true,
        autohide: true,
      });
    }, [id, language, labelToday, labelClear]);

    return (
      <div className="tw-content">
        <div id="tw-container" className="relative tw-datepicker" />
        <div className="tw-datepicker">
          <div className="relative w-72">
            <Label
              htmlFor={id}
              hideLabel={hideLabel}
              hasErrors={Boolean(hasErrors || errorMessage)}
            >
              {label}
            </Label>
            <input
              id={id}
              // @ts-ignore
              datepicker={true}
              datepicker-autohide={true}
              datepicker-buttons
              datepicker-autoselect-today
              type="text"
              lang={language}
              onChange={onChange}
              onSelect={onChange}
              onBlur={onBlur}
              name={name}
              ref={ref}
              disabled={disabled}
              value={value}
              className={`${fieldStyles} disabled:text-gray-500 block flex-1 w-full text-sm `}
              placeholder={placeholder}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ">
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
export { DatePickerComponent, datePickerOptionsByLocale };
