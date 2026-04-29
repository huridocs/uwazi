import React from 'react';
import { Translate } from '#app/I18N/index.js';

const NoDataCell = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Translate className="font-semibold text-xs [color:var(--color-theme-text-secondary)]">
      NO EXTRACTORS
    </Translate>
    .
  </div>
);

export { NoDataCell };
