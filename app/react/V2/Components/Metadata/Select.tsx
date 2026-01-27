import React from 'react';
import { SelectMetadataProperty, MultiSelectMetadataProperty } from '#V2/domain/entities/types.js';
import { MetadataFieldProps } from '#V2/Components/Metadata/types.js';
import { PropertyLabel } from '#V2/Components/Metadata/PropertyLabel.js';
import { MetadataCard } from '#V2/Components/Metadata/MetadataCard.js';

type SelectProps = MetadataFieldProps & {
  values: (SelectMetadataProperty | MultiSelectMetadataProperty)['values'];
};

const formatSelectValue = (
  value: (SelectMetadataProperty | MultiSelectMetadataProperty)['values'][0]
) => {
  let displayValue = value.label || value.value;

  if (value?.parent) {
    const { parent } = value;
    displayValue = `${parent.label}: ${value.label || value.value}`;
  }

  return displayValue;
};

const Select = ({ label, translationContext, values, hideLabel }: SelectProps) => (
  <MetadataCard>
    <dt>
      <PropertyLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    </dt>
    <dd className="flex flex-col gap-1">
      {values.map(value => {
        const formatted = formatSelectValue(value);
        return (
          <span key={formatted} className="font-medium  ext-gray-90 ">
            {formatted}
          </span>
        );
      })}
    </dd>
  </MetadataCard>
);

export { Select };
