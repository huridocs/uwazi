import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';

const DefaultNoDataMessage = () => (
  <div className="p-10 text-center">
    <Translate className="text-gray-500">NO DATA AVAILABLE</Translate>
  </div>
);

export { DefaultNoDataMessage };
