import React from 'react';
import { FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { MultiselectListOption } from '#V2/Components/Forms/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { BaseSelectField } from './BaseSelectField.js';
import { getMetadataSelectedValues, getOptionInfo } from './metadataSelectUtils.js';

type SelectFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  options: MultiselectListOption[];
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  hideFilters?: boolean;
};

const SelectField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  options,
  registerOptions,
  disabled,
  hideFilters,
}: SelectFieldProps<TFormValues>) => (
  <BaseSelectField<TFormValues>
    context={context}
    label={label}
    field={field}
    options={options}
    registerOptions={registerOptions}
    disabled={disabled}
    hideFilters={hideFilters}
    singleSelect
    getSelectedValues={getMetadataSelectedValues}
    onSelectedValuesChange={selectedValues => {
      const selectedValue = selectedValues[0];

      if (!selectedValue) {
        return [];
      }

      const option = getOptionInfo(selectedValue, options);

      return [
        {
          value: selectedValue,
          label: option.label,
          parent: option.parent,
        } satisfies MetadataValue,
      ];
    }}
  />
);

export { SelectField };
