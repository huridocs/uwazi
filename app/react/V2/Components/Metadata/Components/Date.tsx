import React from 'react';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import { Translate } from '#app/I18N/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
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
};

const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';

const displayFormatMap: Record<string, string> = {
  'yyyy-MM-dd': 'yyyy, LLL d',
  'yyyy/MM/dd': 'yyyy, LLL d',
  'dd-MM-yyyy': 'd LLL, yyyy',
  'dd/MM/yyyy': 'd LLL, yyyy',
  'MM-dd-yyyy': 'LLL d, yyyy',
  'MM/dd/yyyy': 'LLL d, yyyy',
};

const normalizeTimestamp = (timestamp: number) =>
  timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;

const formatTimestamp = (timestamp: number, format?: string, locale?: string) => {
  let luxonDate = DateTime.fromSeconds(normalizeTimestamp(timestamp), { zone: 'utc' });

  if (locale) {
    luxonDate = luxonDate.setLocale(locale);
  }

  if (!luxonDate.isValid) {
    return '';
  }

  const selectedFormat = format || DEFAULT_DATE_FORMAT;
  const displayFormat = displayFormatMap[selectedFormat];

  if (displayFormat) {
    return luxonDate.toFormat(displayFormat);
  }

  return luxonDate.toLocaleString(DateTime.DATE_MED);
};

const Date = ({ values, label, translationContext, hideLabel }: DateProps) => {
  const { dateFormat = DEFAULT_DATE_FORMAT } = useAtomValue(settingsAtom);
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
            const formattedValue = formatTimestamp(stamp.value, dateFormat, locale);

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
            ? formatTimestamp(stamp.value.from, dateFormat, locale)
            : '';
          const formattedTo = stamp.value.to
            ? formatTimestamp(stamp.value.to, dateFormat, locale)
            : '';

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
