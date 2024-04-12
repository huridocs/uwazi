import React, { useEffect, Ref, ChangeEventHandler, useRef, useImperativeHandle } from 'react';
//@ts-ignore
import DateRangePicker from 'flowbite-datepicker/DateRangePicker';
//@ts-ignore
import Datepicker from 'flowbite-datepicker/Datepicker';
import 'flowbite/dist/flowbite.min.css';
import uniqueID from 'shared/uniqueID';
import { Label } from '../Label';
import { InputError } from '../InputError';
import { InputField } from '../InputField';
import { DatePickerProps, datePickerOptionsByLocale, validateLocale } from './DatePickerComponent';

interface DateRangePickerProps extends DatePickerProps {
  from?: string | number;
  to?: string | number;
  placeholderStart?: string;
  placeholderEnd?: string;
  onFromDateSelected?: ChangeEventHandler<HTMLInputElement>;
  onToDateSelected?: ChangeEventHandler<HTMLInputElement>;
}
const DateRangePickerComponent = React.forwardRef(
  (
    {
      labelToday,
      labelClear,
      label,
      disabled,
      placeholderStart,
      placeholderEnd,
      hasErrors,
      errorMessage,
      from,
      to,
      id = uniqueID(),
      language = 'en',
      dateFormat = 'yyyy-mm-dd',
      hideLabel = true,
      className = '',
      onFromDateSelected = () => {},
      onToDateSelected = () => {},
      onBlur = () => {},
    }: DateRangePickerProps,
    forwardedRef: Ref<HTMLInputElement | null>
  ) => {
    const divRef = useRef(null);
    const fromRef = useRef(null);
    const toRef = useRef(null);
    useImperativeHandle(forwardedRef, () => divRef.current);

    const fieldStyles = !(hasErrors || errorMessage)
      ? // eslint-disable-next-line max-len
        `${className || ''} bg-gray-50 border border-gray-300`
      : `${className || ''} border-error-300 focus:border-error-500 focus:ring-error-500 border-2 text-error-900 bg-error-50 placeholder-error-700`;
    const instance = useRef<DateRangePicker | null>(null);
    const locale = validateLocale(language);

    useEffect(() => {
      Object.assign(Datepicker.locales, {
        [locale]: {
          ...datePickerOptionsByLocale(locale, labelToday, labelClear),
          format: dateFormat.toLowerCase(),
        },
      });
      const startEl = fromRef.current;
      const endEl = toRef.current;

      instance.current = new DateRangePicker(divRef.current, {
        inputs: [startEl, endEl],
        container: '#tw-container',
        language: locale,
        locales: { [locale]: Datepicker.locales[locale] },
        Mode: 1,
        todayBtnMode: 1,
        todayBtn: true,
        clearBtn: true,
        autohide: true,
        format: dateFormat.toLowerCase(),
      });
      return () => (instance?.current?.hide instanceof Function ? instance?.current?.hide() : {});
    }, [locale, labelToday, labelClear, dateFormat]);

    useEffect(() => {
      instance.current.setDates(from, to);
      if (instance.current?.inputs?.length > 0) {
        if (from === undefined || from === '') {
          instance.current.inputs[0].value = '';
        }
        if (to === undefined || to === '') {
          instance.current.inputs[1].value = '';
        }
      }
    }, [from, to]);

    const handleFromChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
      const empty = (e.target.value || from) === undefined;
      if (from !== e.target.value && !empty) {
        return onFromDateSelected(e);
      }
      return () => {};
    };
    const handleToChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
      const empty = (e.target.value || to) === undefined;
      if (to !== e.target.value && !empty) {
        return onToDateSelected(e);
      }
      return () => {};
    };

    return (
      <div className="tw-content">
        <div id="tw-container" className="relative tw-datepicker" data-test-id={id} />
        <div>
          <Label htmlFor={id} hideLabel={hideLabel} hasErrors={Boolean(hasErrors || errorMessage)}>
            {label}
          </Label>
          <div
            ref={divRef}
            id={id}
            date-rangepicker="true"
            datepicker-buttons="true"
            datepicker-autoselect-today="true"
            className="flex items-center gap-4"
          >
            <div
              // eslint-disable-next-line max-len
              className="relative "
            >
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400 z-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                </svg>
              </div>
              <InputField
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons={true}
                datepicker-autoselect-today={true}
                id="start"
                name="start"
                type="text"
                onSelect={handleFromChanged}
                onBlur={onBlur}
                disabled={disabled}
                value={from}
                // eslint-disable-next-line max-len
                className={`[&>div>*:nth-child(odd)]:bg-transparent [&>div>*:nth-child(odd)]:border-0 [&>div>*:nth-child(odd)]:pl-8 ${fieldStyles} bg-gray-50 border border-gray-300 rounded-lg`}
                placeholder={placeholderStart}
                ref={fromRef}
                clearFieldAction={() => {
                  instance.current?.setDates({ clear: true }, { clear: false });
                  const event = new Event('change');
                  instance.current.inputs[0].dispatchEvent(event);
                  // @ts-ignore
                  onFromDateSelected(event);
                }}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400 z-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                </svg>
              </div>
              <InputField
                // @ts-ignore
                datepicker={true}
                datepicker-autohide={true}
                datepicker-buttons={true}
                datepicker-autoselect-today={true}
                id="end"
                name="end"
                type="text"
                onSelect={handleToChanged}
                onBlur={onBlur}
                disabled={disabled}
                value={to}
                // eslint-disable-next-line max-len
                className={`[&>div>*:nth-child(odd)]:bg-transparent [&>div>*:nth-child(odd)]:border-0 [&>div>*:nth-child(odd)]:pl-8 ${fieldStyles} bg-gray-50 border border-gray-300 rounded-lg`}
                placeholder={placeholderEnd}
                clearFieldAction={() => {
                  instance.current?.setDates({ clear: false }, { clear: true });
                  const event = new Event('change');
                  instance.current.inputs[1].dispatchEvent(event);
                  // @ts-ignore
                  onToDateSelected(event);
                }}
                ref={toRef}
              />
            </div>
          </div>
          {errorMessage && <InputError>{errorMessage}</InputError>}
        </div>
      </div>
    );
  }
);

DateRangePickerComponent.defaultProps = {
  from: undefined,
  to: undefined,
  placeholderStart: 'Select start',
  placeholderEnd: 'Select end',
  onFromDateSelected: () => {},
  onToDateSelected: () => {},
};

export type { DateRangePickerProps };
export { DateRangePickerComponent };
