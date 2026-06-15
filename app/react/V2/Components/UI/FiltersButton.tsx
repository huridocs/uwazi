import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';

type FiltersButtonProps = {
  activeCount: number;
  onClick: () => void;
};

const FiltersButton = ({ activeCount, onClick }: FiltersButtonProps) => {
  const active = activeCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition-colors ${
        active
          ? 'border-border bg-vellum text-ink'
          : 'border-border bg-warm text-ink-secondary hover:bg-parchment hover:text-ink'
      }`}
    >
      <FunnelIcon className={`h-3 w-3 ${active ? 'text-ink' : 'text-ink-tertiary'}`} />
      <span>
        <Translate>Filters</Translate>
      </span>
      {active && (
        <span className="inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-semibold leading-none text-white tabular-nums">
          {activeCount}
        </span>
      )}
    </button>
  );
};

export { FiltersButton };
