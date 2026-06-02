import React, { useMemo } from 'react';
import { LinkMetadataProperty } from '#V2/formatters/types.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import { MetadataCard } from './MetadataCard.js';
import { COMPACT_METADATA_FIELD_LAYOUT } from '../metadataPropertyLayout.js';

type LinkPropertyProps = MetadataFieldProps & {
  values: LinkMetadataProperty['values'];
};

const LinkProperty = ({
  values,
  label,
  translationContext,
  hideLabel,
  className,
}: LinkPropertyProps) => {
  const noValues = useMemo(
    () => values.length === 0 || values.every(value => !value.value || value.value === ''),
    [values]
  );

  if (noValues) {
    return null;
  }

  return (
    <MetadataCard className={className ?? COMPACT_METADATA_FIELD_LAYOUT}>
      <dt>
        <PropertyLabel
          label={label}
          translationContext={translationContext}
          hideLabel={hideLabel}
        />
      </dt>
      {values.map(value => (
        <dd className="font-medium text-ink underline">
          <a href={value.value} target="_blank" rel="noreferrer">
            {value.label || value.value}
          </a>
        </dd>
      ))}
    </MetadataCard>
  );
};

export { LinkProperty };
