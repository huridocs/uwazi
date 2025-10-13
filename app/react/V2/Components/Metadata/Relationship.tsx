import React from 'react';
import { I18NLinkV2 } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { CountryFlag } from '../CustomIcons';
import { MetadataLabel } from './MetadataLabel';
import { MetadataCard } from './MetadataCard';

type RelationshipProps = MetadataFieldProps & {
  values: { label: string; url: string; icon?: string }[];
};

const Relationship = ({ label, translationContext, hideLabel, values }: RelationshipProps) => (
  <MetadataCard>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    <div className="flex flex-col gap-1">
      {values.map(value => (
        <span className="flex flex-row flex-nowrap gap-2 align-middle">
          <dd className="font-medium text-gray-900">
            {value.icon && <CountryFlag id={value.icon} />}
            <I18NLinkV2
              className="underline"
              to={value.url}
              target="_blank"
              rel="noreferrer"
              localized={false}
            >
              {value.label}
            </I18NLinkV2>
          </dd>
        </span>
      ))}
    </div>
  </MetadataCard>
);

export { Relationship };
