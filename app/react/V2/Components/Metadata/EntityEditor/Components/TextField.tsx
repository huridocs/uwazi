/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';

type TextFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  type: 'text' | 'number';
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const TextField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
  type,
}: TextFieldProps<TFormValues>) => {
  const { register } = useFormContext<TFormValues>();

  return (
    <div className="text-ink bg-(--bg-surface)">
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
        type={type}
        disabled={disabled}
        {...register(field, registerOptions)}
      />
    </div>
  );
};

export { TextField };
