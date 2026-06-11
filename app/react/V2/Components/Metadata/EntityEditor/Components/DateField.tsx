import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { secondsToISODate, parseLocalizedDate } from '#V2/shared/dateHelpers.js';

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
    <div className="text-ink bg-(--bg-surface)">
      <Controller
        control={control}
        name={field}
        rules={registerOptions}
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <InputField
            id={field}
            label={
              <div className="font-bold">
                <Translate className="" context={context}>
                  {label}
                </Translate>
                {registerOptions?.required && '*'}
              </div>
            }
            type="date"
            disabled={disabled}
            ref={ref}
            onBlur={onBlur}
            value={secondsToISODate(value) || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const dateString = e.target.value;
              const seconds = dateString ? parseLocalizedDate(dateString) : null;
              onChange(seconds);
            }}
          />
        )}
      />
    </div>
  );
};

export { DateField };
