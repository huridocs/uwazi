import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';

const SelectionError = ({ error }: { error?: string }) => {
  const isVisible = error ? 'visible' : 'invisible';

  return (
    <div
      className={`flex gap-2 p-4 text-xs align-middle rounded-md bg-warning-100 text-warning-700 ${isVisible}`}
    >
      <ExclamationTriangleIcon className="w-4" />
      {error && <Translate>{error}</Translate>}
    </div>
  );
};

export { SelectionError };
