import React from 'react';
import { FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { MultiselectListOption } from '#V2/Components/Forms/index.js';
import { BaseSelectField } from './BaseSelectField.js';

type TemplateFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  options: MultiselectListOption[];
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  hideFilters?: boolean;
};

const getTemplateSelectedValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  return typeof value === 'string' && value ? [value] : [];
};

const TemplateField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  options,
  registerOptions,
  disabled,
  hideFilters,
}: TemplateFieldProps<TFormValues>) => (
  <BaseSelectField<TFormValues>
    context={context}
    label={label}
    field={field}
    options={options}
    registerOptions={registerOptions}
    disabled={disabled}
    hideFilters={hideFilters}
    singleSelect
    getSelectedValues={getTemplateSelectedValues}
    onSelectedValuesChange={selectedValues => selectedValues[0] ?? ''}
  />
);

export { TemplateField };
