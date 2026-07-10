import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { Textarea } from '#V2/Components/Forms/index.js';
import { getFieldErrorMessage } from '../functions/fieldErrorMessage.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import {
  markdownFromMetadataValues,
  metadataValuesFromMarkdown,
  nestedFieldHasValue,
} from '../functions/nestedFieldUtils.js';

type NestedFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const NestedField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: NestedFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();
  const required = Boolean(registerOptions?.required);

  return (
    <div className="text-ink bg-(--bg-surface)">
      <Controller
        control={control}
        name={field}
        rules={{
          ...registerOptions,
          validate: value => {
            if (!required) {
              return true;
            }

            return nestedFieldHasValue(value as MetadataValue[] | undefined) || 'Required';
          },
        }}
        render={({ field: fieldController, fieldState }) => {
          const markdownValue = markdownFromMetadataValues(
            fieldController.value as MetadataValue[]
          );

          return (
            <Textarea
              id={field}
              label={
                <div
                  className={`font-bold ${
                    fieldState.invalid ? 'text-(--color-theme-control-text-error)' : ''
                  }`}
                >
                  <Translate className="" context={context}>
                    {label}
                  </Translate>
                  {registerOptions?.required && '*'}
                </div>
              }
              value={markdownValue}
              onChange={event => {
                fieldController.onChange(metadataValuesFromMarkdown(event.target.value));
              }}
              onBlur={fieldController.onBlur}
              name={fieldController.name}
              ref={fieldController.ref}
              disabled={disabled}
              hasErrors={fieldState.invalid}
              errorMessage={getFieldErrorMessage(fieldState.error)}
              rows={8}
            />
          );
        }}
      />
    </div>
  );
};

export { NestedField };
