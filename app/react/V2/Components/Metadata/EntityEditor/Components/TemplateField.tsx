import React, { useMemo } from 'react';
import { FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { MultiselectListOption } from '#V2/Components/Forms/index.js';
import { ColorDot } from '#V2/Components/UI/ColorDot.js';
import { BaseSelectField } from './BaseSelectField.js';

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
    label: (
      <span className="inline-flex min-w-0 items-center gap-1.5">
        {option.color ? <ColorDot color={option.color} size="md" /> : null}
        <span
          className="truncate normal-case"
          style={option.color ? { color: option.color } : undefined}
        >
          {option.searchLabel}
        </span>
      </span>
    ),
  }));

const TemplateField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  options,
  registerOptions,
  disabled,
  hideFilters,
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
      singleSelect
      getSelectedValues={getTemplateSelectedValues}
      onSelectedValuesChange={(selectedValues, _options) => selectedValues[0] || undefined}
    />
  );
};

export { TemplateField };
