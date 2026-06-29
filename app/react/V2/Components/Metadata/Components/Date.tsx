import React from 'react';
import { useAtomValue } from 'jotai';
import { DateTime, DateTimeFormatOptions } from 'luxon';
import { Translate } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import {
  formatMetadataTimestamp,
  metadataDisplayPresets,
} from '#V2/Components/Metadata/display/index.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';
import { PropertyValue } from '#V2/Components/Metadata/Components/PropertyValue.js';
import { COMPACT_METADATA_FIELD_LAYOUT } from '../metadataPropertyLayout.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import {
  DateMetadataProperty,
  DateRangeMetadataProperty,
  MultiDateMetadataProperty,
  MultiDateRangeMetadataProperty,
} from '#V2/formatters/types.js';

type DateProps = MetadataFieldProps & {
  values:
    | DateMetadataProperty['values']
    | MultiDateMetadataProperty['values']
    | DateRangeMetadataProperty['values']
    | MultiDateRangeMetadataProperty['values'];
  format?: DateTimeFormatOptions;
};

const Date = ({
  values,
  label,
  translationContext,
  hideLabel,
  className,
  format = DateTime.DATE_MED,
}: DateProps) => {
  const locale = useAtomValue(localeAtom);
  const displayContext = { ...metadataDisplayPresets.rich, locale, dateFormat: format };

  if (!values?.length) {
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
      <PropertyValue as="dd" className="flex flex-col gap-1">
        {values.map((stamp, index) => {
          if (typeof stamp.value === 'number') {
            const formattedValue = formatMetadataTimestamp(stamp.value, displayContext);

            if (!formattedValue) {
              return null;
            }

            return (
              // eslint-disable-next-line react/no-array-index-key
              <span key={index}>{formattedValue}</span>
            );
          }

          const formattedFrom = stamp.value.from
            ? formatMetadataTimestamp(stamp.value.from, displayContext)
            : '';
          const formattedTo = stamp.value.to
            ? formatMetadataTimestamp(stamp.value.to, displayContext)
            : '';

          if (!formattedFrom && !formattedTo) {
            return null;
          }

          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index}>
              <span className="sr-only">
                <Translate>From</Translate>
              </span>
              <span> {formattedFrom}</span>
              <span aria-hidden="true"> ~ </span>
              <span className="sr-only">
                <Translate>To</Translate>
              </span>
              <span> {formattedTo}</span>
            </div>
          );
        })}
      </PropertyValue>
    </MetadataCard>
  );
};

export { Date };
