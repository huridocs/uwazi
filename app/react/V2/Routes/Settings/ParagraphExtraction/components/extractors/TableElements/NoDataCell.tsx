import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';

const NoDataCell = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Translate className="text-gray-500 font-semibold text-xs">NO EXTRACTORS</Translate>.
  </div>
);

export { NoDataCell };
