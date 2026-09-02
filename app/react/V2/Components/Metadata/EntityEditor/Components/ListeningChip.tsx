import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';

type ListeningChipProps = {
  label: string;
  onStop: () => void;
};

const ListeningChip = ({ label, onStop }: ListeningChipProps) => (
  <div
    className="inline-flex h-4 items-center gap-1.5 rounded-md bg-warm ps-1.5 pe-0.5"
    data-testid="listening-chip"
    aria-live="polite"
  >
    <span className="size-1.5 shrink-0 rounded-full bg-carbon" aria-hidden />
    <span className="text-meta text-ink-tertiary">
      <Translate>select text or a value</Translate>
    </span>
    <button
      type="button"
      onClick={onStop}
      aria-label={`${t('System', 'Stop filling', null, false)} ${label}`}
      className="inline-flex border-0 bg-transparent p-0 text-ink-tertiary"
    >
      <XMarkIcon className="h-2.5 w-2.5" aria-hidden />
    </button>
  </div>
);

export { ListeningChip };
