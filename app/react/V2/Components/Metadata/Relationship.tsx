import React from 'react';
import { I18NLinkV2 } from 'app/I18N';
import { RelationshipMetadataProperty } from 'V2/domain/entities/types';
import { ENTITY_BASE_ROUTE } from 'V2/Routes/Entity/Entity';
import { MetadataFieldProps } from './types';
import { CountryFlag } from '../CustomIcons';
import { PropertyLabel } from './PropertyLabel';
import { MetadataCard } from './MetadataCard';

type RelationshipProps = MetadataFieldProps & {
  values: Extract<RelationshipMetadataProperty['values'], Array<any>>;
};

const Relationship = ({ label, translationContext, hideLabel, values }: RelationshipProps) => (
  <MetadataCard>
    <dt>
      <PropertyLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    </dt>
    <dd className="flex flex-col gap-1">
      {values.map((value, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={index} className="flex flex-row flex-nowrap gap-2 align-middle">
          {value.icon && <CountryFlag id={value.icon} />}
          <I18NLinkV2
            className="underline"
            to={value.url || `/${ENTITY_BASE_ROUTE}/${value.value}`}
            target="_blank"
            rel="noreferrer"
            localized={false}
          >
            {value.label}
          </I18NLinkV2>
        </span>
      ))}
    </dd>
  </MetadataCard>
);

export { Relationship };
