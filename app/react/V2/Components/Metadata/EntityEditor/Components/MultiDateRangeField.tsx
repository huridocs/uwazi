import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { secondsToISODate, parseLocalizedDate } from '#V2/shared/dateHelpers.js';
import {
  EntityFieldError,
  EntityFieldLabel,
  getFieldErrorState,
} from '../functions/fieldErrorState.js';
import { DateRangeInputs } from './DateRangeInputs.js';
import { EntityField } from './EntityField.js';

type MultiDateRangeFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

type DateRangeEntry = {
  value: {
    from: number | null;
    to: number | null;
  };
};

const toDateRangeEntries = (value: unknown): DateRangeEntry[] => {
  if (Array.isArray(value) && value.length) {
    return value as DateRangeEntry[];
  }

  return [{ value: { from: null, to: null } }];
};

const MultiDateRangeField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: MultiDateRangeFieldProps<TFormValues>) => {
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
          validate: value => {
            const entries = toDateRangeEntries(value);

            if (
              entries.some(entry => {
                if (entry.value.from === null || entry.value.to === null) {
                  return false;
                }

                return entry.value.from > entry.value.to;
              })
            ) {
              return false;
            }

            if (!required) {
              return true;
            }

            return (
              entries.some(entry => entry.value.from !== null || entry.value.to !== null) ||
              'Required'
            );
          },
        }}
        render={({ field: { onChange, onBlur, value, ref }, fieldState }) => {
          const entries = toDateRangeEntries(value);
          const { showError, message } = getFieldErrorState(fieldState);

          return (
            <div className="flex flex-col gap-1.5">
              <EntityFieldLabel
                htmlFor={`${field}.0.value.from`}
                context={context}
                label={label}
                required={Boolean(registerOptions?.required)}
                showError={showError}
              />
              <div className="flex flex-col gap-2">
                {entries.map((entry, index) => {
                  const { from, to } = entry.value;
                  const fromISODate = from !== null ? (secondsToISODate(from) ?? '') : '';
                  const toISODate = to !== null ? (secondsToISODate(to) ?? '') : '';

                  return (
                    <div
                      key={`${field}-${from ?? 'empty'}-${to ?? 'empty'}-${entries.length}`}
                      className="flex flex-col gap-2 md:flex-row md:items-end"
                    >
                      <DateRangeInputs
                        fromId={`${field}.${index}.value.from`}
                        toId={`${field}.${index}.value.to`}
                        fromValue={fromISODate}
                        toValue={toISODate}
                        disabled={disabled}
                        fromRef={index === 0 ? ref : undefined}
                        onBlur={onBlur}
                        hasErrors={showError}
                        fromMax={toISODate || undefined}
                        toMin={fromISODate || undefined}
                        onFromChange={e => {
                          const nextFrom = e.target.value
                            ? parseLocalizedDate(e.target.value)
                            : null;
                          const nextEntries = entries.map((current, currentIndex) =>
                            currentIndex === index
                              ? { value: { from: nextFrom, to: current.value.to } }
                              : current
                          );
                          onChange(nextEntries);
                        }}
                        onToChange={e => {
                          const nextTo = e.target.value ? parseLocalizedDate(e.target.value) : null;
                          const nextEntries = entries.map((current, currentIndex) =>
                            currentIndex === index
                              ? { value: { from: current.value.from, to: nextTo } }
                              : current
                          );
                          onChange(nextEntries);
                        }}
                      />

                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (entries.length === 1) {
                            onChange([{ value: { from: null, to: null } }]);
                            return;
                          }
                          onChange(entries.filter((_, currentIndex) => currentIndex !== index));
                        }}
                      >
                        <Translate className="sr-only">Remove</Translate>
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}

                <div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange([...entries, { value: { from: null, to: null } }])}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <Translate>Add date</Translate>
                  </button>
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

export { MultiDateRangeField };
