import React from 'react';
import { SelectMetadataProperty, MultiSelectMetadataProperty } from 'V2/domain/entities/types';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';
import { MetadataCard } from './MetadataCard';

type SelectProps = MetadataFieldProps & {
  values: (SelectMetadataProperty | MultiSelectMetadataProperty)['values'];
};

const formatSelectValue = (
  value: (SelectMetadataProperty | MultiSelectMetadataProperty)['values'][0]
) => {
  let displayValue = value.label || value.value;

  if (value?.parent) {
    const { parent } = value;
    displayValue = `${value.label || value.value} (${parent.label})`;
  }

  return displayValue;
};

const Select = ({ label, translationContext, values, hideLabel }: SelectProps) => (
  <MetadataCard>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    <div role="group" className="flex flex-col gap-1">
      {values.map(value => {
        const formatted = formatSelectValue(value);
        return (
          <dd key={formatted} className="font-medium  ext-gray-90 ">
            {formatted}
          </dd>
        );
      })}
    </div>
  </MetadataCard>
);

export { Select };
