import React, { useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { ActiveFilterChip } from '#V2/Components/UI/index.js';

type Chip = {
  key: string;
  label: ReactNode;
  color?: string;
  onRemove: () => void;
};

type ActiveFiltersSheetProps = {
  chips: Chip[];
  onClearAll: () => void;
};

const ActiveFiltersSheet = ({ chips, onClearAll }: ActiveFiltersSheetProps) => {
  const [open, setOpen] = useState(true);

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="shrink-0 border-t border-border bg-paper">
      <div className="flex h-9 items-center gap-2 px-3.5">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(current => !current)}
          className="flex cursor-pointer items-center gap-1.5 text-nano font-semibold uppercase tracking-wide text-ink-tertiary transition-colors hover:text-ink"
        >
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform ${open ? '' : '-rotate-90'}`}
          />
          <Translate>Active filters</Translate>
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-warm px-1 text-nano tabular-nums text-ink-secondary">
            {chips.length}
          </span>
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className="ms-auto h-6 cursor-pointer rounded-md px-2 text-nano font-medium text-ink-tertiary transition-colors hover:bg-parchment hover:text-ink"
        >
          <Translate>Clear all</Translate>
        </button>
      </div>
      {open && (
        <div className="flex h-16 flex-wrap gap-1.5 overflow-y-auto px-3.5 pb-3">
          {chips.map(chip => (
            <ActiveFilterChip
              key={chip.key}
              label={chip.label}
              color={chip.color}
              onRemove={chip.onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export type { Chip, ActiveFiltersSheetProps };
export { ActiveFiltersSheet };
