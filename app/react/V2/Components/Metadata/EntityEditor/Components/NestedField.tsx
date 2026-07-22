import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { Textarea } from '#V2/Components/Forms/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import {
  markdownFromMetadataValues,
  metadataValuesFromMarkdown,
  nestedFieldHasValue,
} from '../functions/nestedFieldUtils.js';
import { getFieldErrorState } from '../functions/fieldErrorState.js';
import { EntityField } from './EntityField.js';

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
    <EntityField>
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
          const { showError, message } = getFieldErrorState(fieldState);
          const markdownValue = markdownFromMetadataValues(
            fieldController.value as MetadataValue[]
          );

          return (
            <Textarea
              id={field}
              label={
                <>
                  <Translate context={context}>{label}</Translate>
                  {registerOptions?.required && '*'}
                </>
              }
              value={markdownValue}
              onChange={event => {
                fieldController.onChange(metadataValuesFromMarkdown(event.target.value));
              }}
              onBlur={fieldController.onBlur}
              name={fieldController.name}
              ref={fieldController.ref}
              disabled={disabled}
              hasErrors={showError}
              errorMessage={message}
              rows={8}
            />
          );
        }}
      />
    </EntityField>
  );
};

export { NestedField };
