import React from 'react';
import { FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { Textarea } from '#V2/Components/Forms/index.js';
import { getFieldErrorMessage } from '../functions/fieldErrorMessage.js';
import { EntityField } from './EntityField.js';

type TitleFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const TitleField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: TitleFieldProps<TFormValues>) => {
  const { register, getFieldState, formState } = useFormContext<TFormValues>();
  const fieldState = getFieldState(field, formState);

  return (
    <EntityField>
      <Textarea
        id={field}
        label={
          <>
            <Translate context={context}>{label}</Translate>
            {registerOptions?.required && '*'}
          </>
        }
        disabled={disabled}
        hasErrors={fieldState.invalid}
        errorMessage={getFieldErrorMessage(fieldState.error)}
        rows={2}
        resize="none"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...register(field, registerOptions)}
      />
    </EntityField>
  );
};

export { TitleField };
