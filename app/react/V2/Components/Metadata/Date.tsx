import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { DateMetadataProperty, DateRangeMetadataProperty } from '#V2/domain/entities/types.js';
import { MetadataFieldProps } from './types.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';

type DateProps = MetadataFieldProps & {
  values: DateMetadataProperty['values'] | DateRangeMetadataProperty['values'];
};

const Date = ({ values, label, translationContext, hideLabel }: DateProps) => {
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
          if (typeof stamp.label === 'string') {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <span key={index} className="font-medium text-gray-900">
                {stamp.label}
              </span>
            );
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
              <span>{stamp.label.from}</span>
              <span aria-hidden="true"> ~ </span>
              <span className="sr-only">
                <Translate>To</Translate>
              </span>
              <span>{stamp.label.to}</span>
            </div>
          );
        })}
      </dd>
    </MetadataCard>
  );
};

export { Date };
