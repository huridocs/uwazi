import { Translate } from 'app/I18N';
import React from 'react';

const MetadataLabel = ({
  hideLabel,
  translationContext,
  label,
}: {
  label: string;
  translationContext: string;
  hideLabel?: boolean;
}) => (
  <dt className={`${hideLabel ? 'sr-only' : 'font-bold text-gray-900'}`}>
    <Translate context={translationContext}>{label}</Translate>
  </dt>
);

export { MetadataLabel };
