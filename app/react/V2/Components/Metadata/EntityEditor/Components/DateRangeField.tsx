import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { secondsToISODate, parseLocalizedDate } from '#V2/shared/dateHelpers.js';
import {
  EntityFieldError,
  EntityFieldLabel,
  getFieldErrorState,
} from '../functions/fieldErrorState.js';
import { EntityField } from './EntityField.js';

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
    <EntityField>
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
          const { showError, message } = getFieldErrorState(fieldState);

          return (
            <div>
              <EntityFieldLabel
                htmlFor={`${field}.from`}
                context={context}
                label={label}
                required={Boolean(registerOptions?.required)}
                showError={showError}
              />
              <div className="flex gap-2 md:flex-row md:gap-4">
                <div className="flex w-full flex-row items-center gap-1 md:w-1/2">
                  <label htmlFor={`${field}.from`} aria-hidden>
                    <Translate>From</Translate>:
                  </label>
                  <InputField
                    id={`${field}.from`}
                    hideLabel
                    type="date"
                    disabled={disabled}
                    ref={ref}
                    onBlur={onBlur}
                    value={fromISODate || ''}
                    hasErrors={showError}
                    max={toISODate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const seconds = e.target.value ? parseLocalizedDate(e.target.value) : null;
                      onChange({ from: seconds, to });
                    }}
                  />
                </div>
                <div className="flex w-full flex-row items-center gap-1 md:w-1/2">
                  <label htmlFor={`${field}.to`} aria-hidden>
                    <Translate>To</Translate>:
                  </label>
                  <InputField
                    id={`${field}.to`}
                    hideLabel
                    type="date"
                    disabled={disabled}
                    onBlur={onBlur}
                    value={toISODate || ''}
                    hasErrors={showError}
                    min={fromISODate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const seconds = e.target.value ? parseLocalizedDate(e.target.value) : null;
                      onChange({ from, to: seconds });
                    }}
                  />
                </div>
              </div>
              <EntityFieldError showError={showError} message={message} />
            </div>
          );
        }}
      />
    </EntityField>
  );
};

export { DateRangeField };
