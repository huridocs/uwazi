import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { secondsToISODate, parseLocalizedDate } from '#V2/shared/dateHelpers.js';

type DateRangeFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const toRangeValue = (value: { from: number; to: number } | undefined) => ({
  from: value?.from ?? undefined,
  to: value?.to ?? undefined,
});

const DateRangeField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: DateRangeFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();
  const required = Boolean(registerOptions?.required);

  return (
    <div className="text-ink bg-(--bg-surface)">
      <Controller
        control={control}
        name={field}
        rules={{
          ...registerOptions,
          required: required ? 'Required' : false,
        }}
        render={({ field: { onChange, onBlur, value, ref }, fieldState }) => {
          const { from, to } = toRangeValue(value);
          const fromISODate = from ? secondsToISODate(from) : undefined;
          const toISODate = to ? secondsToISODate(to) : undefined;

          const idFor = `${field}.from`;
          const idTo = `${field}.to`;
          const showRequiredError = fieldState.error?.type === 'required';
          const valueInputClassName = `block w-full rounded-lg border p-2.5 text-sm ${
            showRequiredError
              ? 'border-(--color-theme-control-border-error) bg-(--color-theme-control-bg-error) text-(--color-theme-control-text-error) focus:border-(--color-theme-control-border-error) focus:[box-shadow:0_0_0_4px_var(--color-theme-control-error-ring)]'
              : 'border-(--color-theme-control-border) bg-(--color-theme-control-bg)'
          }`;

          return (
            <div>
              <div
                className={`font-bold mb-2 ${
                  showRequiredError ? 'text-(--color-theme-control-text-error)' : ''
                }`}
              >
                <Translate className="" context={context}>
                  {label}
                </Translate>
                {registerOptions?.required && '*'}
              </div>
              <div className="flex md:flex-row md:gap-4 gap-2">
                <div className="flex flex-row gap-1 items-center md:w-1/2 w-full">
                  <label htmlFor={idFor} aria-hidden>
                    <Translate>From</Translate>:
                  </label>
                  <input
                    id={idFor}
                    type="date"
                    disabled={disabled}
                    ref={ref}
                    onBlur={onBlur}
                    value={fromISODate || undefined}
                    max={toISODate || undefined}
                    className={valueInputClassName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const dateString = e.target.value;
                      const seconds = dateString ? parseLocalizedDate(dateString) : null;
                      onChange({ from: seconds, to });
                    }}
                  />
                </div>
                <div className="flex flex-row gap-1 items-center md:w-1/2 w-full">
                  <label htmlFor={idTo} aria-hidden>
                    <Translate>To</Translate>:
                  </label>
                  <input
                    id={idTo}
                    type="date"
                    disabled={disabled}
                    onBlur={onBlur}
                    value={toISODate || undefined}
                    min={fromISODate || undefined}
                    className={valueInputClassName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const dateString = e.target.value;
                      const seconds = dateString ? parseLocalizedDate(dateString) : null;
                      onChange({ from, to: seconds });
                    }}
                  />
                </div>
              </div>
              {showRequiredError ? (
                <div className="mt-2 text-sm text-(--color-theme-control-text-error)">
                  <Translate>This field is required</Translate>
                </div>
              ) : null}
            </div>
          );
        }}
      />
    </div>
  );
};

export { DateRangeField };
