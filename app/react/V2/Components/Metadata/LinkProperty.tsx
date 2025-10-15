import React from 'react';
import { MetadataLabel } from './MetadataLabel';
import { MetadataFieldProps } from './types';
import { MetadataCard } from './MetadataCard';
import { LinkMetadataProperty } from 'app/V2/domain/entities/types';

type LinkPropertyProps = MetadataFieldProps & {
  values: LinkMetadataProperty['values'];
};

const LinkProperty = ({ values, label, translationContext, hideLabel }: LinkPropertyProps) => (
  <MetadataCard>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
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
