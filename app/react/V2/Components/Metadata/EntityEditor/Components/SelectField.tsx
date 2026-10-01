import React from 'react';
import { FieldValues, Path, RegisterOptions } from 'react-hook-form';
import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import { MultiselectListOption } from '#V2/Components/Forms/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { BaseSelectField } from './BaseSelectField.js';
import { getMetadataSelectedValues, getOptionInfo } from './metadataSelectUtils.js';
import { useThesaurusAdornment } from './ThesaurusValueControls.js';

type SelectFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  options: MultiselectListOption[];
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  hideFilters?: boolean;
  hideLabel?: boolean;
  hideClear?: boolean;
  thesaurus?: ClientThesaurus;
};

const SelectField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  options,
  registerOptions,
  disabled,
  hideFilters,
  hideLabel,
  hideClear,
  thesaurus,
}: SelectFieldProps<TFormValues>) => {
  const bound = useThesaurusAdornment({
    thesaurus,
    options,
    singleSelect: true,
    disabled,
    label,
    context,
    required: Boolean(registerOptions?.required),
    htmlFor: field,
  });

  return (
    <BaseSelectField<TFormValues>
      context={context}
      label={label}
      field={field}
      options={bound.options}
      registerOptions={registerOptions}
      disabled={disabled}
      hideFilters={hideFilters}
      hideLabel={hideLabel || bound.bound}
      hideClear={hideClear || bound.bound}
      singleSelect
      adornment={bound.adornment}
      getSelectedValues={getMetadataSelectedValues}
      onSelectedValuesChange={(selectedValues, availableOptions) => {
        const [selectedValue] = selectedValues;
        if (!selectedValue) {
          return [];
        }
        const option = getOptionInfo(selectedValue, availableOptions);
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
};

export { SelectField };
