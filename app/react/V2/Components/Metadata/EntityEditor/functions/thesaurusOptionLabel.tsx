import React from 'react';
import { Translate } from '#app/I18N/index.js';

const thesaurusFreshLabel = (label: string, context: string) => (
  <span className="inline-flex min-w-0 items-center">
    <Translate context={context}>{label}</Translate>
    <span className="ms-1.5 rounded-sm bg-carbon-tint px-1.5 text-meta font-medium text-carbon">
      <Translate>New</Translate>
    </span>
  </span>
);

export { thesaurusFreshLabel };
