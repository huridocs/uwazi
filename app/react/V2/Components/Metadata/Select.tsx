import React from 'react';
import { I18NLinkV2 } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';
import { MetadataCard } from './MetadataCard';

type SelectValue = {
  value: any;
  label?: string;
  displayValue?: string;
  icon?: any;
  url?: string;
};

type SelectProps = MetadataFieldProps & {
  values: SelectValue[];
};

const Select = ({ label, translationContext, values, hideLabel }: SelectProps) => (
  <MetadataCard>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    <div className="flex flex-col gap-1">
      {values.map((value, index) => (
        <dd key={index} className="font-medium text-gray-900">
          {value.url ? (
            <I18NLinkV2
              className="underline"
              to={value.url}
              target="_blank"
              rel="noreferrer"
              localized={false}
            >
              {value.displayValue || value.label || value.value}
            </I18NLinkV2>
          ) : (
            <span>{value.displayValue || value.label || value.value}</span>
          )}
        </dd>
      ))}
    </div>
  </MetadataCard>
);

export { Select };
