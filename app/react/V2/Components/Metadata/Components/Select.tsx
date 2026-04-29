import React from 'react';
import { SelectMetadataProperty, MultiSelectMetadataProperty } from '#V2/metadata/types.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';

type SelectProps = MetadataFieldProps & {
  values: SelectMetadataProperty | MultiSelectMetadataProperty;
};

const formatSelectValue = (
  value: SelectMetadataProperty['values'][0] | MultiSelectMetadataProperty['values'][0]
) => {
  let displayValue = value.label || value.value;

  if (value?.parent) {
    const { parent } = value;
    displayValue = `${parent.label}: ${value.label || value.value}`;
  }

  return displayValue;
};

const Select = ({ label, translationContext, values, hideLabel }: SelectProps) => {
  if (!values?.values?.length) {
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
      <dd className="flex flex-col gap-1">
        {values.values.map(value => {
          const formatted = formatSelectValue(value);
          return (
            <span key={formatted} className="font-medium text-gray-900">
              {formatted}
            </span>
          );
        })}
      </dd>
    </MetadataCard>
  );
};

export { Select };
