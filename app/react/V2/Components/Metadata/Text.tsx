import React from 'react';
import { MetadataLabel } from './MetadataLabel';
import { MetadataFieldProps } from './types';
import { MetadataCard } from './MetadataCard';

type TextProps = MetadataFieldProps & {
  values: {
    value: string;
  }[];
};

const Text = ({ label, translationContext, values, hideLabel }: TextProps) => (
  <MetadataCard>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    <dd className="font-medium text-gray-900">{values?.[0]?.value}</dd>
  </MetadataCard>
);

export { Text };
