import React from 'react';
import { SimpleMetadataProperty } from '#app/V2/domain/entities/types.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataFieldProps } from '../types.js';
import { MetadataCard } from './MetadataCard.js';

type SimpleValueProps = MetadataFieldProps & {
  values: SimpleMetadataProperty['values'];
};

const SimpleValue = ({ label, translationContext, values, hideLabel }: SimpleValueProps) => {
  const value = values?.[0]?.value ?? '';

  if (value === '') {
    return null;
  }

  return (
    <MetadataCard>
      <dt>
        <PropertyLabel
          label={label}
          translationContext={translationContext}
          hideLabel={hideLabel}
        />
      </dt>
      <dd className="font-medium text-sm text-gray-900">{value}</dd>
    </MetadataCard>
  );
};

export { SimpleValue };
