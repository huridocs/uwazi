/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';

type TextFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const TextField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: TextFieldProps<TFormValues>) => {
  const { register } = useFormContext<TFormValues>();

  return (
    <label className="flex flex-col gap-2 text-ink bg-(--bg-surface)">
      <div className="font-semibold">
        <Translate className="" context={context}>
          {label}
        </Translate>
        {registerOptions?.required && '*'}
      </div>
      <input
        className="w-full border rounded p-1 border-(--border-soft)"
        type="text"
        {...register(field, registerOptions)}
        disabled={disabled}
      />
    </label>
  );
};

export { TextField };
