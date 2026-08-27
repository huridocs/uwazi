import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { secondsToISODate, parseLocalizedDate } from '#V2/shared/dateHelpers.js';
import { getFieldErrorState } from '../functions/fieldErrorState.js';
import { EntityPdfFillField, type PdfFillTarget } from './EntityPdfFillField.js';

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

  return (
    <EntityPdfFillField
      field={field}
      setValue={setValue}
      label={label}
      disabled={disabled}
      pdfFill={pdfFill}
      placement="beside"
    >
      {slot => (
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
                onFocus={() => slot?.onFocus()}
                onClick={slot?.onClick}
                value={secondsToISODate(value) || ''}
                className="max-w-48"
                labelAccessory={slot?.labelAccessory}
                latched={slot?.latched}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const dateString = e.target.value;
                  const seconds = dateString ? parseLocalizedDate(dateString) : null;
                  onChange(seconds);
                }}
              />
            );
          }}
        />
      )}
    </EntityPdfFillField>
  );
};

export { DateField };
