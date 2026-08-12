import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { secondsToISODate, parseLocalizedDate } from '#V2/shared/dateHelpers.js';
import { getFieldErrorState } from '../functions/fieldErrorState.js';
import { applyPdfFillFormValue } from '../functions/applyPdfFillFormValue.js';
import { EntityField } from './EntityField.js';
import { EntityPdfFill } from './EntityPdfFill.js';
import type { PdfFillTarget } from './EntityPdfFill.js';

type DateFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  pdfFill?: PdfFillTarget;
};

const DateField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
  pdfFill,
}: DateFieldProps<TFormValues>) => {
  const { control, setValue } = useFormContext<TFormValues>();

  const renderField = (overlay?: React.ReactNode) => (
    <Controller
      control={control}
      name={field}
      rules={registerOptions}
      render={({ field: { onChange, onBlur, value, ref }, fieldState }) => {
        const { showError, message } = getFieldErrorState(fieldState);

        return (
          <InputField
            id={field}
            label={
              <>
                <Translate context={context}>{label}</Translate>
                {registerOptions?.required && '*'}
              </>
            }
            type="date"
            disabled={disabled}
            hasErrors={showError}
            errorMessage={message}
            ref={ref}
            onBlur={onBlur}
            value={secondsToISODate(value) || ''}
            className="max-w-48"
            overlay={overlay}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const dateString = e.target.value;
              const seconds = dateString ? parseLocalizedDate(dateString) : null;
              onChange(seconds);
            }}
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

export { DateField };
