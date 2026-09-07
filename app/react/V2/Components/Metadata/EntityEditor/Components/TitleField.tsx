import React from 'react';
import { FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { Textarea } from '#V2/Components/Forms/index.js';
import { getFieldErrorMessage } from '../functions/fieldErrorMessage.js';
import { EntityPdfFillField } from './EntityPdfFillField.js';

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
  const { register, setValue, getFieldState, formState } = useFormContext<TFormValues>();
  const fieldState = getFieldState(field, formState);
  const registration = register(field, registerOptions);

  return (
    <EntityPdfFillField
      field={field}
      setValue={setValue}
      label={label}
      disabled={disabled}
      pdfFill={{ name: 'title', coerceType: 'text' }}
    >
      {slot => (
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
          overlay={slot?.overlay}
          labelAccessory={slot?.labelAccessory}
          latched={slot?.latched}
          onClick={slot?.onClick}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...registration}
          onFocus={() => slot?.onFocus()}
        />
      )}
    </EntityPdfFillField>
  );
};

export { TitleField };
