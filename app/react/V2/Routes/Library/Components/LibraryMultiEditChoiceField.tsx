import React from 'react';
import type { ClientThesaurus, Property } from '#app/apiResponseTypes.js';
import type { FieldValues, Path } from 'react-hook-form';
import {
  MultiselectField,
  SelectField,
} from '#V2/Components/Metadata/EntityEditor/Components/index.js';
import { thesaurusToOptions } from '#V2/Components/Metadata/EntityEditor/functions/relationshipFieldHelpers.js';
import type { FormMetadataProperty } from '#V2/Components/Metadata/EntityEditor/functions/formatMetadataForForm.js';

type LibraryMultiEditChoiceFieldProps = {
  property: Property;
  disabled: boolean;
  field: Path<FieldValues>;
  thesauri: ClientThesaurus[];
};

const LibraryMultiEditChoiceField = ({
  property,
  disabled,
  field,
  thesauri,
}: LibraryMultiEditChoiceFieldProps) => {
  const options = thesaurusToOptions(thesauri, property as FormMetadataProperty);
  const context = property.content || 'System';

  if (property.type === 'multiselect') {
    return (
      <MultiselectField
        context={context}
        label={property.label}
        field={field}
        disabled={disabled}
        options={options}
      />
    );
  }

  return (
    <SelectField
      context={context}
      label={property.label}
      field={field}
      disabled={disabled}
      hideFilters
      options={options}
    />
  );
};

export { LibraryMultiEditChoiceField };
