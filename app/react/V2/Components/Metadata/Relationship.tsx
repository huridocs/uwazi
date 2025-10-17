import React from 'react';
import { I18NLinkV2 } from 'app/I18N';
import { RelationshipMetadataProperty } from 'app/V2/domain/entities/types';
import { MetadataFieldProps } from './types';
import { CountryFlag } from '../CustomIcons';
import { PropertyLabel } from './PropertyLabel';
import { MetadataCard } from './MetadataCard';

type RelationshipProps = MetadataFieldProps & {
  values: Extract<RelationshipMetadataProperty['values'], Array<any>>;
};

const Relationship = ({ label, translationContext, hideLabel, values }: RelationshipProps) => {
  return (
    <MetadataCard>
      <dt>
        <PropertyLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
      </dt>
      <div className="flex flex-col gap-1">
        {values.map((value, index) => (
          <span key={index} className="flex flex-row flex-nowrap gap-2 align-middle">
            <dd className="font-medium text-gray-900">
              {value.icon && <CountryFlag id={value.icon} />}
              <I18NLinkV2
                className="underline"
                to={value.url || `/entityv2/${value.value}`}
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
};

export { Relationship };
