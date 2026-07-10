import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { Textarea } from '#V2/Components/Forms/index.js';
import { getFieldErrorMessage } from '../functions/fieldErrorMessage.js';

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
    <div className="text-ink bg-(--bg-surface)">
      <Controller
        control={control}
        name={field}
        rules={registerOptions}
        render={({ field: fieldController, fieldState }) => (
          <Textarea
            id={field}
            label={
              <div className="font-bold">
                <Translate className="" context={context}>
                  {label}
                </Translate>
                {registerOptions?.required && '*'}
              </div>
            }
            value={fieldController.value || ''}
            onChange={fieldController.onChange}
            onBlur={fieldController.onBlur}
            name={fieldController.name}
            ref={fieldController.ref}
            disabled={disabled}
            hasErrors={fieldState.invalid}
            errorMessage={getFieldErrorMessage(fieldState.error)}
            rows={6}
          />
        )}
      />
    </div>
  );
};

export { MarkdownField };
