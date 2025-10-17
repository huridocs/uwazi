import React from 'react';
import { I18NLinkV2 } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { CountryFlag } from '../CustomIcons';
import { MetadataLabel } from './MetadataLabel';
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

const Relationship = ({ label, translationContext, hideLabel, values }: RelationshipProps) => {
  const formatRelationshipLabel = (value: RelationshipValue) => {
    let displayLabel = value.label;
    return displayLabel;
  };

  return (
    <MetadataCard>
      <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
      <div className="flex flex-col gap-1">
        {values.map((value, index) => (
          <span key={index} className="flex flex-row flex-nowrap gap-2 align-middle">
            <dd className="font-medium text-gray-900">
              {value.icon && (
                <CountryFlag
                  id={typeof value.icon === 'string' ? value.icon : value.icon._id || ''}
                />
              )}
              <I18NLinkV2
                className="underline"
                to={value.url || `/entity/${value.value}`}
                target="_blank"
                rel="noreferrer"
                localized={false}
              >
                {formatRelationshipLabel(value)}
              </I18NLinkV2>
            </dd>
          </span>
        ))}
      </div>
    </MetadataCard>
  );
};

export { Relationship };
