import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';

const SelectionError = ({ error }: { error?: string }) => {
  const isVisible = error ? 'visible' : 'invisible';

  return (
    <div
      className={`flex gap-2 rounded-md p-4 text-xs align-middle ${isVisible}`}
      style={{
        backgroundColor: 'var(--color-theme-warning-banner-bg)',
        color: 'var(--color-theme-warning-banner-fg)',
      }}
    >
      <ExclamationTriangleIcon className="w-4" />
      {error && <Translate>{error}</Translate>}
    </div>
  );
};

export { SelectionError };
