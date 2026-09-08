import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { secondsToISODate, parseLocalizedDate } from '#V2/shared/dateHelpers.js';
import {
  EntityFieldError,
  EntityFieldLabel,
  getFieldErrorState,
} from '../functions/fieldErrorState.js';
import { DateRangeInputs } from './DateRangeInputs.js';
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
            <div className="flex flex-col gap-1.5">
              <EntityFieldLabel
                htmlFor={`${field}.from`}
                context={context}
                label={label}
                required={Boolean(registerOptions?.required)}
                showError={showError}
              />
              <div className="flex gap-2">
                <DateRangeInputs
                  fromId={`${field}.from`}
                  toId={`${field}.to`}
                  fromValue={fromISODate || ''}
                  toValue={toISODate || ''}
                  disabled={disabled}
                  fromRef={ref}
                  onBlur={onBlur}
                  hasErrors={showError}
                  fromMax={toISODate ?? undefined}
                  toMin={fromISODate ?? undefined}
                  onFromChange={e => {
                    const seconds = e.target.value ? parseLocalizedDate(e.target.value) : null;
                    onChange({ from: seconds, to });
                  }}
                  onToChange={e => {
                    const seconds = e.target.value ? parseLocalizedDate(e.target.value) : null;
                    onChange({ from, to: seconds });
                  }}
                />
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
