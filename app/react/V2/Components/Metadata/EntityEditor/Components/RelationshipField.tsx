import React from 'react';
import { FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { MultiselectListOption } from '#V2/Components/Forms/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { BaseSelectField } from './BaseSelectField.js';
import { getMetadataSelectedValues, getOptionInfo } from './metadataSelectUtils.js';

type RelationshipFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  options: MultiselectListOption[];
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  hideFilters?: boolean;
  lookupSearch?: (search: string) => Promise<MultiselectListOption[]>;
};

const RelationshipField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  options,
  registerOptions,
  disabled,
  hideFilters,
  lookupSearch,
}: RelationshipFieldProps<TFormValues>) => (
  <BaseSelectField<TFormValues>
    context={context}
    label={label}
    field={field}
    options={options}
    registerOptions={registerOptions}
    disabled={disabled}
    hideFilters={hideFilters}
    lookupSearch={lookupSearch}
    getSelectedValues={getMetadataSelectedValues}
    onSelectedValuesChange={(selectedValues, availableOptions) =>
      selectedValues.map(value => {
        const option = getOptionInfo(value, availableOptions);

        return {
          value,
          type: 'entity',
          label: option.label,
        } satisfies MetadataValue;
      })
    }
  />
);

export { RelationshipField };
