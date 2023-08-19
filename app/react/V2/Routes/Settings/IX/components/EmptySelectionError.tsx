import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';

const EmptySelectionError = () => (
  <div className="flex gap-2 p-4 align-middle rounded-md bg-warning-100 text-warning-700">
    <ExclamationTriangleIcon className="w-4" />
    <Translate className="">Could not detect the area for the selected text</Translate>
  </div>
);

export { EmptySelectionError };
