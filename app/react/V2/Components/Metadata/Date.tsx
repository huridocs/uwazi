import React from 'react';
import { Translate } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';
import { MetadataCard } from './MetadataCard';
import { DateMetadataProperty, DateRangeMetadataProperty } from 'app/V2/domain/entities/types';

type DateProps = MetadataFieldProps & {
  values: DateMetadataProperty['values'] | DateRangeMetadataProperty['values'];
};

const Date = ({ values, label, translationContext, hideLabel }: DateProps) => (
  <MetadataCard>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    <div className="flex flex-col gap-1" role="group">
      {values.map(stamp => {
        if (typeof stamp.label === 'string') {
          return <dd className="font-medium text-gray-900">{stamp.label}</dd>;
        }
        return (
          <dd className="font-medium text-gray-900">
            <span className="sr-only">
              <Translate>From</Translate>
            </span>
            <span>{stamp.label.from}</span>
            <span aria-hidden="true"> - </span>
            <span className="sr-only">
              <Translate>To</Translate>
            </span>
            <span>{stamp.label.to}</span>
          </dd>
        );
        return null;
      })}
    </div>
  </MetadataCard>
);

export { Date };
