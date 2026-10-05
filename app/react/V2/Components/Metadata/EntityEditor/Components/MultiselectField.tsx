import React from 'react';
import { FieldValues, Path, RegisterOptions } from 'react-hook-form';
import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import { MultiselectListOption } from '#V2/Components/Forms/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { BaseSelectField } from './BaseSelectField.js';
import { getMetadataSelectedValues, getOptionInfo } from './metadataSelectUtils.js';
import { useThesaurusAdornment } from './ThesaurusValueControls.js';

type MultiselectFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  options: MultiselectListOption[];
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  hideFilters?: boolean;
  hideLabel?: boolean;
  thesaurus?: ClientThesaurus;
};

const MultiselectField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  options,
  registerOptions,
  disabled,
  hideFilters,
  hideLabel,
  thesaurus,
}: MultiselectFieldProps<TFormValues>) => {
  const bound = useThesaurusAdornment({
    thesaurus,
    options,
    singleSelect: false,
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
      adornment={bound.adornment}
      getSelectedValues={getMetadataSelectedValues}
      onSelectedValuesChange={(selectedValues, availableOptions) =>
        selectedValues.map(value => {
          const option = getOptionInfo(value, availableOptions);
          return {
            value,
            label: option.label,
            parent: option.parent,
          } satisfies MetadataValue;
        })
      }
    />
  );
};

export { MultiselectField };
