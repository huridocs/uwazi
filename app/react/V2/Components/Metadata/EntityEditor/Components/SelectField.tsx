import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { MultiselectList, MultiselectListOption } from '#V2/Components/Forms/index.js';

type SelectFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  options: MultiselectListOption[];
  singleSelect: boolean;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const SelectField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
  options,
  singleSelect,
}: SelectFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();

  return (
    <label className="flex flex-col gap-2 text-ink bg-(--bg-surface)">
      <div className="font-semibold">
        <Translate className="" context={context}>
          {label}
        </Translate>
        {registerOptions?.required && '*'}
      </div>
      <Controller
        control={control}
        name={field}
        rules={registerOptions}
        render={({ field: fieldController, fieldState }) => (
          <div className="w-full h-52 overflow-y-auto">
            <MultiselectList
              items={options}
              singleSelect={singleSelect}
              selectedValues={
                typeof fieldController.value === 'string' && fieldController.value
                  ? [fieldController.value]
                  : []
              }
              onChange={selectedValues => {
                if (disabled) {
                  return;
                }

                fieldController.onChange(selectedValues[0] ?? '');
              }}
              hasErrors={fieldState.invalid}
            />
          </div>
        )}
      />
    </label>
  );
};

export { SelectField };
