import React, { useEffect, useState } from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { MultiselectList, MultiselectListOption } from '#V2/Components/Forms/index.js';
import { defaultSearch } from '#V2/Components/Forms/MultiselectList/MultiselectList.js';

type BaseSelectFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  options: MultiselectListOption[];
  singleSelect?: boolean;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  hideFilters?: boolean;
  getSelectedValues: (value: unknown) => string[];
  onSelectedValuesChange: (selectedValues: string[]) => unknown;
};

const BaseSelectField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
  options,
  singleSelect,
  hideFilters,
  getSelectedValues,
  onSelectedValuesChange,
}: BaseSelectFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();
  const [optionsState, setOptionsState] = useState<MultiselectListOption[]>(options);

  useEffect(() => {
    setOptionsState(options);
  }, [options]);

  return (
    <Controller
      control={control}
      name={field}
      rules={registerOptions}
      render={({ field: fieldController, fieldState }) => (
        <div className="h-52">
          <MultiselectList
            id={field}
            checkboxes
            label={
              <div
                className={`font-semibold ${fieldState.invalid ? 'text-(--color-theme-control-text-error)' : ''}`}
              >
                <Translate className="" context={context}>
                  {label}
                </Translate>
                {registerOptions?.required && '*'}
              </div>
            }
            items={optionsState}
            onSearch={search => setOptionsState(defaultSearch(search, options))}
            singleSelect={singleSelect}
            selectedValues={getSelectedValues(fieldController.value)}
            onChange={selectedValues => {
              if (disabled) {
                return;
              }

              fieldController.onChange(onSelectedValuesChange(selectedValues));
            }}
            hasErrors={fieldState.invalid}
            hideFilters={hideFilters}
          />
        </div>
      )}
    />
  );
};

export { BaseSelectField };
