import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';

type LibraryResultsBlankProps = {
  mode: 'prompt' | 'none';
  search?: string;
  onClearSearch?: () => void;
};

const LibraryResultsBlank = ({ mode, search = '', onClearSearch }: LibraryResultsBlankProps) => {
  if (mode === 'prompt') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <MagnifyingGlassIcon className="h-5 w-5 text-ink-muted" aria-hidden />
        <span className="text-sm text-ink-tertiary">
          <Translate>Search to see where terms match</Translate>
        </span>
        <span className="text-xs text-ink-muted">
          <Translate>Results show the passages behind each hit.</Translate>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="text-sm text-ink-tertiary">
        <Translate>No matches for</Translate>{' '}
        <span className="font-medium text-ink-secondary">“{search}”</span>
      </span>
      <button
        type="button"
        onClick={onClearSearch}
        className="cursor-pointer rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
      >
        <Translate>Clear search</Translate>
      </button>
    </div>
  );
};

export { LibraryResultsBlank };
