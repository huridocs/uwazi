import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { relationshipsPanelSortAtom } from './relationshipsPanelFiltersAtom.js';
import { sortOptionLabels } from './relationshipsPanelLabels.js';

const sortOptionIds: RelationshipsPanelSort[] = ['none', 'appearance', 'asc', 'desc'];

const RelationshipsSortControl = () => {
  const [sortOrder, setSortOrder] = useAtom(relationshipsPanelSortAtom);
  const [open, setOpen] = useState(false);
  const activeLabel = sortOptionLabels[sortOrder];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-6 cursor-pointer items-center gap-1 rounded-md border border-border bg-warm px-2 text-[11px] font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
      >
        <span className="text-ink-tertiary">
          <Translate>Sort:</Translate>
        </span>
        <span>
          <Translate>{activeLabel}</Translate>
        </span>
        <ChevronDownIcon className="h-2.5 w-2.5 text-ink-muted" aria-hidden />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label={t('System', 'Sort order', null, false)}
            className="absolute left-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-paper shadow-lg"
          >
            {sortOptionIds.map(id => (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={sortOrder === id}
                onClick={() => {
                  setSortOrder(id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                  sortOrder === id ? 'bg-vellum text-ink' : 'text-ink-secondary hover:bg-warm'
                }`}
              >
                <Translate>{sortOptionLabels[id]}</Translate>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export { RelationshipsSortControl };
