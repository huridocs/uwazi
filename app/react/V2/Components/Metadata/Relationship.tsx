import React from 'react';
import { I18NLinkV2 } from 'app/I18N';
import { RelationshipMetadataProperty } from 'V2/domain/entities/types';
import { MetadataFieldProps } from './types';
import { CountryFlag } from '../CustomIcons';
import { MetadataLabel } from './MetadataLabel';
import { MetadataCard } from './MetadataCard';

type RelationshipProps = MetadataFieldProps & {
  values: RelationshipMetadataProperty['values'];
};

const Relationship = ({ label, translationContext, hideLabel, values }: RelationshipProps) => {
  const formatRelationshipLabel = (value: RelationshipProps['values'][0]) => {
    let displayLabel = value.label;

    // // Handle inherited values display
    // if (
    //   value.inheritedValue &&
    //   Array.isArray(value.inheritedValue) &&
    //   value.inheritedValue.length > 0
    // ) {
    //   const inheritedLabels = value.inheritedValue
    //     .map((inherited: any) => inherited.label || inherited.value)
    //     .filter(Boolean);

    //   if (inheritedLabels.length > 0) {
    //     displayLabel = `${value.label} (${inheritedLabels.join(', ')})`;
    //   }
    // }

    return displayLabel;
  };

  return (
    <MetadataCard>
      <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
      <div className="flex flex-col gap-1">
        {values.map((value, index) => (
          <span key={index} className="flex flex-row flex-nowrap gap-2 align-middle">
            <dd className="font-medium text-gray-900">
              {value.icon && <CountryFlag id={value.icon} />}
              <I18NLinkV2
                className="underline"
                to={value.url}
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
