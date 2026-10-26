import React, { useMemo } from 'react';
import { FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { MultiselectListOption } from '#V2/Components/Forms/index.js';
import { BaseSelectField } from './BaseSelectField.js';
import { TemplateOptionLabel } from './TemplateOptionLabel.js';

type TemplateSelectOption = {
  value: string;
  searchLabel: string;
  color?: string;
};

type TemplateFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  options: TemplateSelectOption[];
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  hideFilters?: boolean;
  hideClear?: boolean;
  placeholder?: string;
};

const getTemplateSelectedValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  return typeof value === 'string' && value ? [value] : [];
};

const toSelectOptions = (options: TemplateSelectOption[]): MultiselectListOption[] =>
  options.map(option => ({
    value: option.value,
    searchLabel: option.searchLabel,
    label: <TemplateOptionLabel name={option.searchLabel} color={option.color} />,
  }));

const TemplateField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  options,
  registerOptions,
  disabled,
  hideFilters,
  hideClear,
  placeholder,
}: TemplateFieldProps<TFormValues>) => {
  const selectOptions = useMemo(() => toSelectOptions(options), [options]);

  return (
    <BaseSelectField<TFormValues>
      context={context}
      label={label}
      field={field}
      options={selectOptions}
      registerOptions={registerOptions}
      disabled={disabled}
      hideFilters={hideFilters}
      hideClear={hideClear}
      placeholder={placeholder}
      singleSelect
      getSelectedValues={getTemplateSelectedValues}
      onSelectedValuesChange={(selectedValues, _options) => selectedValues[0] || undefined}
    />
  );
};

export { TemplateField };
