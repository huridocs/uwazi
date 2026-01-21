import React from 'react';
import { I18NLinkV2 } from '#app/I18N/index.js';
import { RelationshipMetadataProperty } from '#V2/domain/entities/types.js';
import { DEFAULT_ENTITY_BASE_PATH } from '#V2/application/optionsPresets.js';
import { MetadataFieldProps } from '#V2/Components/Metadata/types.js';
import { CountryFlag } from '#V2/Components/CustomIcons/index.js';
import { PropertyLabel } from '#V2/Components/Metadata/PropertyLabel.jsx';
import { MetadataCard } from '#V2/Components/Metadata/MetadataCard.jsx';

type RelationshipProps = MetadataFieldProps & {
  values: Extract<RelationshipMetadataProperty['values'], Array<any>>;
};

const Relationship = ({ label, translationContext, hideLabel, values }: RelationshipProps) => (
  <MetadataCard>
    <dt>
      <PropertyLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    </dt>
    <dd className="flex flex-col gap-1">
      {values.map((value, index) => {
        const itemKey = value.value || value.url || value.label || `${label}-${index}`;
        return (
          <span key={itemKey} className="flex flex-row flex-nowrap gap-2 align-middle">
            {value.icon && <CountryFlag id={value.icon} />}
            <I18NLinkV2
              className="underline"
              to={value.url || `${DEFAULT_ENTITY_BASE_PATH}${value.value}`}
              target="_blank"
              rel="noreferrer"
              localized={false}
            >
              {value.label}
            </I18NLinkV2>
          </span>
        );
      })}
    </dd>
  </MetadataCard>
);

export { Relationship };
