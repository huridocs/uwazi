import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { relationshipsPanelSortAtom } from './relationshipsPanelFiltersAtom.js';

const options: { id: RelationshipsPanelSort; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'asc', label: 'A → Z' },
  { id: 'desc', label: 'Z → A' },
];

const RelationshipsSortControl = () => {
  const [sortOrder, setSortOrder] = useAtom(relationshipsPanelSortAtom);
  const [open, setOpen] = useState(false);
  const active = options.find(option => option.id === sortOrder);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-6 cursor-pointer items-center gap-1 rounded-md border border-border bg-warm px-2 text-[11px] font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
      >
        <span className="text-ink-tertiary">Sort:</span>
        <span>{active?.label}</span>
        <ChevronDownIcon className="h-2.5 w-2.5 text-ink-muted" aria-hidden />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label="Sort order"
            className="absolute left-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-paper shadow-lg"
          >
            {options.map(option => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={sortOrder === option.id}
                onClick={() => {
                  setSortOrder(option.id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                  sortOrder === option.id
                    ? 'bg-vellum text-ink'
                    : 'text-ink-secondary hover:bg-warm'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export { RelationshipsSortControl };
