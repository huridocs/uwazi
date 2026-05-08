import React from 'react';
import { I18NLinkV2 } from '#app/I18N/index.js';
import {
  RelationshipMetadataProperty,
  RelatedRelationshipMetadataProperty,
} from '#V2/formatters/types.js';
import { CountryFlag } from '../../CustomIcons/index.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';

const DEFAULT_ENTITY_BASE_PATH = '/entityv2/';

type RelationshipProps = MetadataFieldProps & {
  values: RelationshipMetadataProperty['values'];
};

const isEntityRelationshipValue = (
  value: RelationshipMetadataProperty['values'][number]
): value is RelatedRelationshipMetadataProperty['values'][number] => 'title' in value;

const Relationship = ({ label, translationContext, hideLabel, values }: RelationshipProps) => {
  if (!Array.isArray(values) || !values.length || !values.every(isEntityRelationshipValue)) {
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
        {values.map((value, index) => {
          const itemKey = value._id || `${label}-${index}`;

          if (value.authorized === false) {
            return (
              <span key={itemKey} className="flex flex-row flex-nowrap gap-2 align-middle">
                {value.icon?._id && <CountryFlag id={value.icon._id} />}
                <span>{value.title}</span>
              </span>
            );
          }

          return (
            <span key={itemKey} className="flex flex-row flex-nowrap gap-2 align-middle">
              {value.icon?._id && <CountryFlag id={value.icon._id} />}
              <I18NLinkV2
                className="underline"
                to={`${DEFAULT_ENTITY_BASE_PATH}${value._id}`}
                target="_blank"
                rel="noreferrer"
                localized={false}
              >
                {value.title}
              </I18NLinkV2>
            </span>
          );
        })}
      </dd>
    </MetadataCard>
  );
};

export { Relationship };
