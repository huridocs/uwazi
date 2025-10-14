import React from 'react';
import { MetadataLabel } from './MetadataLabel';
import { MetadataFieldProps } from './types';
import { MetadataCard } from './MetadataCard';

type SimpleValueProps = MetadataFieldProps & {
  values: {
    value: string | number;
  }[];
};

const SimpleValue = ({ label, translationContext, values, hideLabel }: SimpleValueProps) => {
  const value = values?.[0]?.value ?? '';

  return (
    <MetadataCard>
      <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
      <dd className="font-medium text-gray-900">{value}</dd>
    </MetadataCard>
  );
};

export { SimpleValue };
