import React from 'react';
import { MetadataLabel } from './MetadataLabel';
import { MetadataFieldProps } from './types';

type TextProps = MetadataFieldProps & {
  values: {
    value: string;
  }[];
};

const Text = ({ label, translationContext, values, hideLabel }: TextProps) => (
  <div>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    <dd className="font-medium text-gray-900">{values?.[0]?.value}</dd>
  </div>
);

export { Text };
