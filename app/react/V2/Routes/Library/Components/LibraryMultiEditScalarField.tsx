import React from 'react';
import type { Property } from '#app/apiResponseTypes.js';
import type { FieldValues, Path } from 'react-hook-form';
import { NestedField, TextField } from '#V2/Components/Metadata/EntityEditor/Components/index.js';
import { LibraryMultiEditDateField } from './LibraryMultiEditDateField.js';

type LibraryMultiEditScalarFieldProps = {
  property: Property;
  context: string;
  disabled: boolean;
  field: Path<FieldValues>;
};

const LibraryMultiEditScalarField = ({
  property,
  context,
  disabled,
  field,
}: LibraryMultiEditScalarFieldProps) => {
  const { type, label } = property;

  if (type === 'numeric' || type === 'generatedid') {
    return (
      <TextField
        context={context}
        label={label}
        field={field}
        disabled={disabled}
        type={type === 'numeric' ? 'number' : 'text'}
      />
    );
  }

  if (type === 'nested') {
    return <NestedField context={context} label={label} field={field} disabled={disabled} />;
  }

  return (
    <LibraryMultiEditDateField
      property={property}
      context={context}
      disabled={disabled}
      field={field}
    />
  );
};

export { LibraryMultiEditScalarField };
