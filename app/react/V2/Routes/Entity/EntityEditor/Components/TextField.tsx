/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';

type TextFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
};

const TextField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
}: TextFieldProps<TFormValues>) => {
  const {
    register,
    formState: { isSubmitting },
  } = useFormContext<TFormValues>();

  return (
    <label>
      <Translate context={context}>{label}</Translate>
      <input type="text" {...register(field, registerOptions)} disabled={isSubmitting} />
    </label>
  );
};

export { TextField };
