import React from 'react';
import { Translate } from '#app/I18N/index.js';

const PropertyLabel = ({
  hideLabel,
  translationContext,
  label,
}: {
  label: string;
  translationContext: string;
  hideLabel?: boolean;
}) => (
  <Translate
    className={`${hideLabel ? 'sr-only' : 'font-bold text-gray-900'}`}
    context={translationContext}
  >
    {label}
  </Translate>
);

export { PropertyLabel };
