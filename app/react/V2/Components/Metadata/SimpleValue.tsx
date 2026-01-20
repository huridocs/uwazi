import React from 'react';
import { SimpleMetadataProperty } from '#V2/domain/entities/types.js';
import { PropertyLabel } from '#V2/Components/Metadata/PropertyLabel.jsx';
import { MetadataFieldProps } from '#V2/Components/Metadata/types.js';
import { MetadataCard } from '#V2/Components/Metadata/MetadataCard.jsx';

type SimpleValueProps = MetadataFieldProps & {
  values: SimpleMetadataProperty['values'];
};

const SimpleValue = ({ label, translationContext, values, hideLabel }: SimpleValueProps) => {
  const value = values?.[0]?.value ?? '';

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
