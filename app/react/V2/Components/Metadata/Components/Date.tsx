import React from 'react';
import { useAtomValue } from 'jotai';
import { DateTime, DateTimeFormatOptions } from 'luxon';
import { Translate } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';
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

const normalizeTimestamp = (timestamp: number) =>
  timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;

const formatTimestamp = (timestamp: number, format?: DateTimeFormatOptions, locale?: string) => {
  let luxonDate = DateTime.fromSeconds(normalizeTimestamp(timestamp), { zone: 'utc' });

  if (locale) {
    luxonDate = luxonDate.setLocale(locale);
  }

  if (!luxonDate.isValid) {
    return '';
  }

  return luxonDate.toLocaleString(format);
};

const Date = ({
  values,
  label,
  translationContext,
  hideLabel,
  format = DateTime.DATE_MED,
}: DateProps) => {
  const locale = useAtomValue(localeAtom);

  if (!values?.length) {
    return null;
  }

  return (
    <MetadataCard>
      <dt>
        <PropertyLabel
          label={label}
          translationContext={translationContext}
          hideLabel={hideLabel}
        />
      </dt>
      <dd className="flex flex-col gap-1">
        {values.map((stamp, index) => {
          if (typeof stamp.value === 'number') {
            const formattedValue = formatTimestamp(stamp.value, format, locale);

            if (!formattedValue) {
              return null;
            }

            return (
              // eslint-disable-next-line react/no-array-index-key
              <span key={index} className="font-medium text-gray-900">
                {formattedValue}
              </span>
            );
          }

          const formattedFrom = stamp.value.from
            ? formatTimestamp(stamp.value.from, format, locale)
            : '';
          const formattedTo = stamp.value.to ? formatTimestamp(stamp.value.to, format, locale) : '';

          if (!formattedFrom && !formattedTo) {
            return null;
          }

          return (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="font-medium text-gray-900"
            >
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
      </dd>
    </MetadataCard>
  );
};

export { Date };
