import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { secondsToISODate, parseLocalizedDate } from '#V2/shared/dateHelpers.js';

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
    <div className="text-ink bg-(--bg-surface)">
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
          const showRequiredError = fieldState.error?.type === 'required';

          return (
            <div>
              <div className="font-bold mb-2">
                <Translate className="" context={context}>
                  {label}
                </Translate>
                {registerOptions?.required && '*'}
              </div>
              <div className="flex flex-col gap-2">
                {entries.map((entry, currentIndex) => (
                  <div
                    key={`${field}-${entry.value ?? 'empty'}-${entries.length}`}
                    className="flex items-center gap-2"
                  >
                    <input
                      id={`${field}.${currentIndex}.value`}
                      type="date"
                      disabled={disabled}
                      ref={currentIndex === 0 ? ref : undefined}
                      onBlur={onBlur}
                      value={entry.value !== null ? (secondsToISODate(entry.value) ?? '') : ''}
                      className="block w-full rounded-lg border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-2.5 text-sm"
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
                      <XCircleIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange([...entries, { value: null }])}
                    className="rounded-lg border border-(--color-theme-control-border) px-3 py-2 text-sm"
                  >
                    <Translate>Add date</Translate>
                  </button>
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

export { MultidateField };
