import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { secondsToISODate, parseLocalizedDate } from '#V2/shared/dateHelpers.js';
import { getFieldErrorState } from '../functions/fieldErrorState.js';
import { EntityField } from './EntityField.js';

type DateFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const DateField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: DateFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();

  return (
    <EntityField>
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const dateString = e.target.value;
                const seconds = dateString ? parseLocalizedDate(dateString) : null;
                onChange(seconds);
              }}
            />
          );
        }}
      />
    </EntityField>
  );
};

export { DateField };
