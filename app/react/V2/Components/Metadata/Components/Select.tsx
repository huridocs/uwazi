import React from 'react';
import { SelectMetadataProperty, MultiSelectMetadataProperty } from '#V2/formatters/types.js';
import { formatMetadataSelectValue } from '#V2/Components/Metadata/display/index.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';
import { COMPACT_METADATA_FIELD_LAYOUT } from '../metadataPropertyLayout.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';

type SelectProps = MetadataFieldProps & {
  values: SelectMetadataProperty | MultiSelectMetadataProperty;
};

const Select = ({ label, translationContext, values, hideLabel, className }: SelectProps) => {
  if (!values?.values?.length) {
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
      <dd className="flex flex-col gap-1">
        {values.values.map(value => {
          const formatted = formatMetadataSelectValue(value);
          return (
            <span key={formatted} className="font-medium text-ink">
              {formatted}
            </span>
          );
        })}
      </dd>
    </MetadataCard>
  );
};

export { Select };
