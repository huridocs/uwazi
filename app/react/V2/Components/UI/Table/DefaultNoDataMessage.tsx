import React from 'react';
import { Translate } from 'app/I18N';

const DefaultNoDataMessage = () => (
  <div className="p-10 text-center">
    <Translate className="text-gray-500">NO DATA AVAILABLE</Translate>
  </div>
);

export { DefaultNoDataMessage };
