import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
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
          const hasRange = typeof from === 'number' || typeof to === 'number';
          const fromISODate = from ? secondsToISODate(from) : undefined;
          const toISODate = to ? secondsToISODate(to) : undefined;
          const { showError, message } = getFieldErrorState(fieldState);

          return (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <EntityFieldLabel
                  htmlFor={`${field}.from`}
                  context={context}
                  label={label}
                  required={Boolean(registerOptions?.required)}
                  showError={showError}
                />
                {hasRange && !disabled ? (
                  <button
                    type="button"
                    onClick={() => onChange({ from: null, to: null })}
                    data-testid="clear-field-button"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:cursor-pointer focus:outline-hidden enabled:hover:text-ink-secondary disabled:opacity-50"
                  >
                    <XMarkIcon className="h-3.5 w-3.5 text-ink-muted" />
                    <Translate className="sr-only">Clear</Translate>
                  </button>
                ) : null}
              </div>
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
