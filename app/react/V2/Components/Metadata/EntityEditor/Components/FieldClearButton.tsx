import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';

type FieldClearButtonProps = {
  onClick: () => void;
};

const FieldClearButton = ({ onClick }: FieldClearButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    data-testid="clear-field-button"
    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:cursor-pointer focus:outline-hidden enabled:hover:text-ink-secondary disabled:opacity-50"
  >
    <XMarkIcon className="h-3.5 w-3.5 text-ink-muted" />
    <Translate className="sr-only">Clear</Translate>
  </button>
);

export { FieldClearButton };
export type { FieldClearButtonProps };
