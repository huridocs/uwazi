import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { Textarea } from '#V2/Components/Forms/index.js';
import { getFieldErrorState } from '../functions/fieldErrorState.js';
import { EntityPdfFillField, type PdfFillTarget } from './EntityPdfFillField.js';

type MarkdownFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  pdfFill?: PdfFillTarget;
};

const MarkdownField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
  pdfFill,
}: MarkdownFieldProps<TFormValues>) => {
  const { control, setValue } = useFormContext<TFormValues>();

  return (
    <EntityPdfFillField
      field={field}
      setValue={setValue}
      label={label}
      disabled={disabled}
      pdfFill={pdfFill}
    >
      {slot => (
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
                onFocus={() => slot?.onFocus()}
                onClick={slot?.onClick}
                name={fieldController.name}
                ref={fieldController.ref}
                disabled={disabled}
                hasErrors={showError}
                errorMessage={message}
                rows={6}
                overlay={slot?.overlay}
                labelAccessory={slot?.labelAccessory}
                latched={slot?.latched}
              />
            );
          }}
        />
      )}
    </EntityPdfFillField>
  );
};

export { MarkdownField };
