import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';

const ViewFileButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={t('System', 'View', null, false)}
    className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-warm px-2.5 py-1 text-micro font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
  >
    <EyeIcon className="h-nano w-nano text-ink-tertiary" />
    <Translate>View</Translate>
  </button>
);

export { ViewFileButton };
