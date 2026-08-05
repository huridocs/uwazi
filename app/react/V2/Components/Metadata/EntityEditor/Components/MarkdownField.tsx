import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { Textarea } from '#V2/Components/Forms/index.js';
import { getFieldErrorState } from '../functions/fieldErrorState.js';
import { EntityField } from './EntityField.js';

type MarkdownFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const MarkdownField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: MarkdownFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();

  return (
    <EntityField>
      <Controller
        control={control}
        name={field}
        rules={registerOptions}
        render={({ field: fieldController, fieldState }) => {
          const { showError, message } = getFieldErrorState(fieldState);

          return (
            <Textarea
              id={field}
              label={
                <>
                  <Translate context={context}>{label}</Translate>
                  {registerOptions?.required && '*'}
                </>
              }
              value={fieldController.value || ''}
              onChange={fieldController.onChange}
              onBlur={fieldController.onBlur}
              name={fieldController.name}
              ref={fieldController.ref}
              disabled={disabled}
              hasErrors={showError}
              errorMessage={message}
              rows={6}
            />
          );
        }}
      />
    </EntityField>
  );
};

export { MarkdownField };
