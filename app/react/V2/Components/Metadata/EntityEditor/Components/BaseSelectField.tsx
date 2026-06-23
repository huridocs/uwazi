import React, { useEffect, useMemo, useState } from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import {
  MultiselectList,
  MultiselectListOption,
  SearchSelect,
} from '#V2/Components/Forms/index.js';
import { defaultSearch } from '#V2/Components/Forms/MultiselectList/MultiselectList.js';
import { multiselectOptionsToSearchSelect } from './metadataSelectUtils.js';

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
  const searchSelectOptions = useMemo(() => multiselectOptionsToSearchSelect(options), [options]);

  useEffect(() => {
    setOptionsState(options);
  }, [options]);

  const renderLabel = (invalid: boolean) => (
    <div className={`font-semibold ${invalid ? 'text-(--color-theme-control-text-error)' : ''}`}>
      <Translate className="" context={context}>
        {label}
      </Translate>
      {registerOptions?.required && '*'}
    </div>
  );

  return (
    <Controller
      control={control}
      name={field}
      rules={registerOptions}
      render={({ field: fieldController, fieldState }) => {
        if (singleSelect) {
          const selectedValue = getSelectedValues(fieldController.value)[0] ?? '';

          return (
            <SearchSelect
              id={field}
              label={renderLabel(fieldState.invalid)}
              options={searchSelectOptions.options}
              groups={searchSelectOptions.groups}
              value={selectedValue}
              disabled={disabled}
              hasErrors={fieldState.invalid}
              onChange={value => {
                if (disabled) {
                  return;
                }

                fieldController.onChange(onSelectedValuesChange(value ? [value] : []));
              }}
            />
          );
        }

        return (
          <div className="h-52">
            <MultiselectList
              id={field}
              checkboxes
              label={renderLabel(fieldState.invalid)}
              items={optionsState}
              onSearch={search => setOptionsState(defaultSearch(search, options))}
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
        );
      }}
    />
  );
};

export { BaseSelectField };
