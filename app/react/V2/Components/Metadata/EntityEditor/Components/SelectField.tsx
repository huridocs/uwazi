import React, { useState } from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { MultiselectList, MultiselectListOption } from '#V2/Components/Forms/index.js';
import { defaultSearch } from '#V2/Components/Forms/MultiselectList/MultiselectList.js';

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
  const [optionsState, setOptionsState] = useState<MultiselectListOption[]>(options);

  return (
    <Controller
      control={control}
      name={field}
      rules={registerOptions}
      render={({ field: fieldController, fieldState }) => (
        <div className="h-52 overflow-y-auto">
          <MultiselectList
            foldableGroups={false}
            checkboxes
            label={
              <div className="font-semibold">
                <Translate className="" context={context}>
                  {label}
                </Translate>
                {registerOptions?.required && '*'}
              </div>
            }
            items={optionsState}
            onSearch={search => setOptionsState(defaultSearch(search, options))}
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
            hideFilters
          />
        </div>
      )}
    />
  );
};

export { SelectField };
