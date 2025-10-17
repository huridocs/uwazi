import React from 'react';
import { LinkMetadataProperty } from 'V2/domain/entities/types';
import { PropertyLabel } from './PropertyLabel';
import { MetadataFieldProps } from './types';
import { MetadataCard } from './MetadataCard';

type LinkPropertyProps = MetadataFieldProps & {
  values: LinkMetadataProperty['values'];
};

const LinkProperty = ({ values, label, translationContext, hideLabel }: LinkPropertyProps) => (
  <MetadataCard>
    <dt>
      <PropertyLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    </dt>
    {values.map(value => (
      <dd className="font-medium text-gray-900 underline">
        <a href={value.value} target="_blank" rel="noreferrer">
          {value.label || value.value}
        </a>
      </dd>
    ))}
  </MetadataCard>
);

export { LinkProperty };
