import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';

const MISSING_FACET_ID = 'missing';
const NO_LABEL_KEY = 'No Label';
const SYSTEM_CONTEXT = 'System';

const facetValueLabel = (id: string, label: string, context?: string): ReactNode => {
  if (id === MISSING_FACET_ID) {
    return <Translate context={SYSTEM_CONTEXT}>{NO_LABEL_KEY}</Translate>;
  }
  return context ? <Translate context={context}>{label}</Translate> : label;
};

export { MISSING_FACET_ID, NO_LABEL_KEY, SYSTEM_CONTEXT, facetValueLabel };
