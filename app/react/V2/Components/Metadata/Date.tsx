import React from 'react';
import { useParams } from 'react-router';
import { Translate } from 'app/I18N';
import { secondsToDate } from 'V2/shared/dateHelpers';
import { MetadataFieldProps } from './types';

type DateValue = number | { from: number; to: number };

type DateProps = MetadataFieldProps & {
  timestamps: DateValue[];
};

const Date = ({ timestamps, label, translationContext, hideLabel }: DateProps) => {
  const locale = useParams().lang || 'en';

  return (
    <div>
      <dt className={`${hideLabel ? 'sr-only' : 'font-bold text-gray-900'}`}>
        <Translate context={translationContext}>{label}</Translate>
      </dt>
      {timestamps.map(stamp => {
        if (typeof stamp === 'number') {
          return <dd className="font-medium text-gray-900">{secondsToDate(stamp, locale)}</dd>;
        }
        return (
          <dd className="font-medium text-gray-900">
            <span className="sr-only">
              <Translate>From</Translate>
            </span>
            <span>{secondsToDate(stamp.from, locale)}</span>
            <span aria-hidden="true">-</span>
            <span className="sr-only">
              <Translate>To</Translate>
            </span>
            <span>{secondsToDate(stamp.to, locale)}</span>
          </dd>
        );
      })}
    </div>
  );
};

export { Date };
