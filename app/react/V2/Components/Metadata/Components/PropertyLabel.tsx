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
    className={
      hideLabel ? 'sr-only' : 'text-xs font-semibold uppercase tracking-wide text-ink-tertiary'
    }
    context={translationContext}
  >
    {label}
  </Translate>
);

export { PropertyLabel };
