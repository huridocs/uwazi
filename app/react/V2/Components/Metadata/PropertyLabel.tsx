import { Translate } from 'app/I18N';
import React from 'react';

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
