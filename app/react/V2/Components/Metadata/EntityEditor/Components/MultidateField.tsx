import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { secondsToISODate, parseLocalizedDate } from '#V2/shared/dateHelpers.js';
import {
  EntityFieldError,
  EntityFieldLabel,
  getFieldErrorState,
} from '../functions/fieldErrorState.js';
import { EntityField } from './EntityField.js';

type MultidateFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

type DateEntry = { value: number | null };

const toDateEntries = (value: unknown): DateEntry[] =>
  Array.isArray(value) && value.length ? (value as DateEntry[]) : [{ value: null }];

const MultidateField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: MultidateFieldProps<TFormValues>) => {
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
            if (!required) {
              return true;
            }

            const entries = toDateEntries(value);
            return entries.some(entry => entry.value !== null) || 'Required';
          },
        }}
        render={({ field: { onChange, onBlur, value, ref }, fieldState }) => {
          const entries = toDateEntries(value);
          const { showError, message } = getFieldErrorState(fieldState);

          return (
            <div>
              <EntityFieldLabel
                htmlFor={`${field}.0.value`}
                context={context}
                label={label}
                required={Boolean(registerOptions?.required)}
                showError={showError}
              />
              <div className="flex flex-col gap-2">
                {entries.map((entry, currentIndex) => (
                  <div
                    key={`${field}-${entry.value ?? 'empty'}-${entries.length}`}
                    className="flex items-center gap-2"
                  >
                    <InputField
                      id={`${field}.${currentIndex}.value`}
                      hideLabel
                      type="date"
                      disabled={disabled}
                      ref={currentIndex === 0 ? ref : undefined}
                      onBlur={onBlur}
                      value={entry.value !== null ? (secondsToISODate(entry.value) ?? '') : ''}
                      hasErrors={showError}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const seconds = e.target.value ? parseLocalizedDate(e.target.value) : null;
                        const nextEntries = entries.map((current, indexToUpdate) =>
                          indexToUpdate === currentIndex ? { ...current, value: seconds } : current
                        );
                        onChange(nextEntries);
                      }}
                    />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (entries.length === 1) {
                          onChange([{ value: null }]);
                          return;
                        }
                        onChange(
                          entries.filter((_, indexToDelete) => indexToDelete !== currentIndex)
                        );
                      }}
                    >
                      <Translate className="sr-only">Remove</Translate>
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange([...entries, { value: null }])}
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

export { MultidateField };
