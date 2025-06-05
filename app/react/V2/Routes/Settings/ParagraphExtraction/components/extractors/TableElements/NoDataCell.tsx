import React from 'react';
import { Translate } from 'app/I18N';

const NoDataCell = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Translate className="text-gray-500 font-semibold text-xs">NO EXTRACTORS</Translate>.
  </div>
);

export { NoDataCell };
