import React from 'react';
import type { ClientThesaurus, Property } from '#app/apiResponseTypes.js';
import { GeolocationField } from '#V2/Components/Metadata/EntityEditor/Components/index.js';
import type { FormMetadataProperty } from '#V2/Components/Metadata/EntityEditor/functions/formatMetadataForForm.js';
import { fieldPath } from './multiEditFieldPath.js';
import { LibraryMultiEditChoiceField } from './LibraryMultiEditChoiceField.js';
import { LibraryMultiEditRelationship } from './LibraryMultiEditRelationship.js';
import { LibraryMultiEditScalarField } from './LibraryMultiEditScalarField.js';

type LibraryMultiEditSharedFieldProps = {
  property: Property;
  context: string;
  disabled: boolean;
  thesauri: ClientThesaurus[];
};

const LibraryMultiEditSharedField = ({
  property,
  context,
  disabled,
  thesauri,
}: LibraryMultiEditSharedFieldProps) => {
  const path = fieldPath(property, undefined, '');

  if (property.type === 'select' || property.type === 'multiselect') {
    return (
      <LibraryMultiEditChoiceField
        property={property}
        disabled={disabled}
        field={path}
        thesauri={thesauri}
      />
    );
  }

  if (property.type === 'geolocation') {
    return (
      <GeolocationField context={context} label={property.label} field={path} disabled={disabled} />
    );
  }

  if (property.type === 'relationship') {
    return (
      <LibraryMultiEditRelationship
        property={property as FormMetadataProperty}
        context={context}
        disabled={disabled}
        field={path}
      />
    );
  }

  return (
    <LibraryMultiEditScalarField
      property={property}
      context={context}
      disabled={disabled}
      field={path}
    />
  );
};

export type { LibraryMultiEditSharedFieldProps };
export { LibraryMultiEditSharedField };
