import React from 'react';
import { I18NLinkV2 } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';
import { MetadataCard } from './MetadataCard';
import { SelectMetadataProperty, MultiSelectMetadataProperty } from 'V2/domain/entities/types';

type SelectProps = MetadataFieldProps & {
  values: (SelectMetadataProperty | MultiSelectMetadataProperty)['values'];
};

const Select = ({ label, translationContext, values, hideLabel }: SelectProps) => {
  const formatSelectValue = (
    value: (SelectMetadataProperty | MultiSelectMetadataProperty)['values'][0]
  ) => {
    let displayValue = value.label || value.value;

    if (value && typeof value === 'object' && value.parent) {
      const parent = value.parent;
      displayValue = `${value.label || value.value} (${parent.label})`;
    }

    return displayValue;
  };

  return (
    <MetadataCard>
      <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
      <div className="flex flex-col gap-1">
        {values.map((value, index) => (
          <dd key={index} className="font-medium  ext-gray-90 ">
            {value.value ? (
              <I18NLinkV2
                className="underline"
                to={value.value}
                target="_blank"
                rel="noreferrer"
                localized={false}
              >
                {formatSelectValue(value)}
              </I18NLinkV2>
            ) : (
              <span>{formatSelectValue(value)}</span>
            )}
          </dd>
        ))}
      </div>
    </MetadataCard>
  );
};

export { Select };
