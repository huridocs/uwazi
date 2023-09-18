import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';

const SelectionError = ({ error }: { error: string }) => (
  <div className="flex gap-2 p-4 align-middle rounded-md bg-warning-100 text-warning-700">
    <ExclamationTriangleIcon className="w-4" />
    <Translate>{error}</Translate>
  </div>
);

export { SelectionError };
