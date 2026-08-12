import React from 'react';
import { FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { applyPdfFillFormValue } from '../functions/applyPdfFillFormValue.js';
import { getFieldErrorState } from '../functions/fieldErrorState.js';
import { EntityField } from './EntityField.js';
import { EntityPdfFill, type PdfFillTarget } from './EntityPdfFill.js';

type TextFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  type: 'text' | 'number';
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  pdfFill?: PdfFillTarget;
};

const TextField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
  type,
  pdfFill,
}: TextFieldProps<TFormValues>) => {
  const { register, setValue, getFieldState, formState } = useFormContext<TFormValues>();
  const fieldState = getFieldState(field, formState);
  const { showError, message } = getFieldErrorState(fieldState);

  const input = (overlay?: React.ReactNode) => (
    <InputField
      id={field}
      label={
        <>
          <Translate context={context}>{label}</Translate>
          {registerOptions?.required && '*'}
        </>
      }
      type={type}
      disabled={disabled}
      hasErrors={showError}
      errorMessage={message}
      overlay={overlay}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...register(field, registerOptions)}
    />
  );

  if (!pdfFill) {
    return <EntityField>{input()}</EntityField>;
  }

  return (
    <EntityField>
      <EntityPdfFill
        target={pdfFill}
        disabled={disabled}
        applyValue={value => applyPdfFillFormValue(setValue, field, value)}
      >
        {overlay => input(overlay)}
      </EntityPdfFill>
    </EntityField>
  );
};

export { TextField };
