import React from 'react';
import { FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { MultiselectListOption } from '#V2/Components/Forms/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { BaseSelectField } from './BaseSelectField.js';
import { getMetadataSelectedValues } from './metadataSelectUtils.js';

type RelationshipFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  options: MultiselectListOption[];
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  hideFilters?: boolean;
};

const RelationshipField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  options,
  registerOptions,
  disabled,
  hideFilters,
}: RelationshipFieldProps<TFormValues>) => (
  <BaseSelectField<TFormValues>
    context={context}
    label={label}
    field={field}
    options={options}
    registerOptions={registerOptions}
    disabled={disabled}
    hideFilters={hideFilters}
    getSelectedValues={getMetadataSelectedValues}
    onSelectedValuesChange={selectedValues =>
      selectedValues.map(
        value =>
          ({
            value,
            type: 'entity',
          }) satisfies MetadataValue
      )
    }
  />
);

export { RelationshipField };