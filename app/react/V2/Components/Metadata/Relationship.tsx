import React from 'react';
import { I18NLinkV2 } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { CountryFlag } from '../CustomIcons';
import { PropertyLabel } from './PropertyLabel';
import { MetadataCard } from './MetadataCard';

type RelationshipValue = {
  value: string;
  label: string;
  icon?: { _id: string } | string;
  url: string;
};

type RelationshipProps = MetadataFieldProps & {
  values: RelationshipValue[];
};

const formatRelationshipLabel = (value: RelationshipProps['values'][0]) => {
  return value.label;
};

const Relationship = ({ label, translationContext, hideLabel, values }: RelationshipProps) => (
  <MetadataCard>
    <dt>
      <PropertyLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    </dt>
    <dd className="flex flex-col gap-1">
      {values.map((value, index) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="flex font-medium text-gray-900 flex-row flex-nowrap gap-2 align-middle"
        >
          {value.icon && <CountryFlag id={value.icon._id || ''} />}
          <I18NLinkV2
            className="underline"
            to={value.url}
            target="_blank"
            rel="noreferrer"
            localized={false}
          >
            {formatRelationshipLabel(value)}
          </I18NLinkV2>
        </span>
      ))}
    </dd>
  </MetadataCard>
);

export { Relationship };
