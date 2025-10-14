import React from 'react';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';
import { MetadataCard } from './MetadataCard';

type GenericProps = MetadataFieldProps & {
  values: any[];
};

const Generic = ({ label, translationContext, values, hideLabel }: GenericProps) => {
  const renderValue = (value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (value.label && value.url) {
        // Link format
        return (
          <a
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {value.label}
          </a>
        );
      }
      if (value.value !== undefined) {
        return value.label || value.value;
      }
      return JSON.stringify(value);
    }
    return value?.toString() || '';
  };

  return (
    <MetadataCard>
      <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
      <dd className="font-medium text-gray-900">
        {values?.map((value, index) => <div key={index}>{renderValue(value.value || value)}</div>)}
      </dd>
    </MetadataCard>
  );
};

export { Generic };
