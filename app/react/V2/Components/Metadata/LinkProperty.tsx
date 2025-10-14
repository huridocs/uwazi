import React from 'react';
import { MetadataLabel } from './MetadataLabel';
import { MetadataFieldProps } from './types';
import { MetadataCard } from './MetadataCard';

type LinkPropertyProps = MetadataFieldProps & {
  values: {
    label: string;
    url: string;
  }[];
};

const LinkProperty = ({ label, translationContext, values, hideLabel }: LinkPropertyProps) => (
  <MetadataCard>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    {values.map(value => (
      <dd className="font-medium text-gray-900 underline">
        <a href={value.url} target="_blank" rel="noreferrer">
          {value.label || value.url}
        </a>
      </dd>
    ))}
  </MetadataCard>
);

export { LinkProperty };
