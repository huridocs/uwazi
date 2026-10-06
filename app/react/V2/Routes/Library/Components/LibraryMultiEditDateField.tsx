import React from 'react';
import type { Property } from '#app/apiResponseTypes.js';
import type { FieldValues, Path } from 'react-hook-form';
import {
  DateField,
  DateRangeField,
  MultidateField,
  MultiDateRangeField,
} from '#V2/Components/Metadata/EntityEditor/Components/index.js';

type LibraryMultiEditDateFieldProps = {
  property: Property;
  context: string;
  disabled: boolean;
  field: Path<FieldValues>;
};

const LibraryMultiEditDateField = ({
  property,
  context,
  disabled,
  field,
}: LibraryMultiEditDateFieldProps) => {
  const { type, label } = property;

  if (type === 'date') {
    return <DateField context={context} label={label} field={field} disabled={disabled} />;
  }

  if (type === 'daterange') {
    return <DateRangeField context={context} label={label} field={field} disabled={disabled} />;
  }

  if (type === 'multidate') {
    return <MultidateField context={context} label={label} field={field} disabled={disabled} />;
  }

  if (type === 'multidaterange') {
    return (
      <MultiDateRangeField context={context} label={label} field={field} disabled={disabled} />
    );
  }

  return null;
};

export { LibraryMultiEditDateField };
