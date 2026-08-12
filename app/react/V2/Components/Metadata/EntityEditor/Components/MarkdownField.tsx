import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { Textarea } from '#V2/Components/Forms/index.js';
import { getFieldErrorState } from '../functions/fieldErrorState.js';
import { applyPdfFillFormValue } from '../functions/applyPdfFillFormValue.js';
import { EntityField } from './EntityField.js';
import { EntityPdfFill } from './EntityPdfFill.js';
import type { PdfFillTarget } from './EntityPdfFill.js';

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

  const renderField = (overlay?: React.ReactNode) => (
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
            overlay={overlay}
          />
        );
      }}
    />
  );

  if (!pdfFill) {
    return <EntityField>{renderField()}</EntityField>;
  }

  return (
    <EntityField>
      <EntityPdfFill
        target={pdfFill}
        disabled={disabled}
        applyValue={value => applyPdfFillFormValue(setValue, field, value)}
      >
        {overlay => renderField(overlay)}
      </EntityPdfFill>
    </EntityField>
  );
};

export { MarkdownField };
