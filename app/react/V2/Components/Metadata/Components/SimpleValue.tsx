import React from 'react';
import { SimpleMetadataProperty } from '#V2/formatters/types.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import { MetadataCard } from './MetadataCard.js';

type SimpleValueProps = MetadataFieldProps & {
  values: SimpleMetadataProperty['values'];
};

const SimpleValue = ({
  label,
  translationContext,
  values,
  hideLabel,
  className,
}: SimpleValueProps) => {
  const nonEmptyValues =
    values?.filter(v => v.value !== '' && v.value !== undefined && v.value !== null) ?? [];

  if (nonEmptyValues.length === 0) {
    return null;
  }

  return (
    <MetadataCard className={className}>
      <dt>
        <PropertyLabel
          label={label}
          translationContext={translationContext}
          hideLabel={hideLabel}
        />
      </dt>
      <dd className="flex flex-col gap-1">
        {nonEmptyValues.map((v, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <span key={index} className="font-medium text-sm text-ink">
            {v.value}
          </span>
        ))}
      </dd>
    </MetadataCard>
  );
};

export { SimpleValue };
