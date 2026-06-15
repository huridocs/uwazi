import React, { useRef } from 'react';
import { useAtom } from 'jotai';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { relationshipsPanelSearchAtom } from './relationshipsPanelFiltersAtom.js';

const RelationshipsSearchBar = () => {
  const [query, setQuery] = useAtom(relationshipsPanelSearchAtom);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-1.5 px-3 pb-2 pt-0.5">
      <div
        className="flex min-h-8 min-w-0 flex-1 cursor-text items-center gap-1 rounded-md border border-border bg-warm py-1 pl-2 pr-2 transition-all focus-within:border-ink/40 focus-within:ring-2 focus-within:ring-ink/20"
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('System', 'Search by title, text, or type', null, false)}
          aria-label={t('System', 'Search relationships', null, false)}
          className="h-6 min-w-[100px] flex-1 bg-transparent text-xs font-medium placeholder:text-ink-muted focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label={t('System', 'Clear search', null, false)}
            className="shrink-0 cursor-pointer rounded-full p-0.5 text-ink-muted transition-colors hover:bg-parchment hover:text-ink"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        )}
        <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />
      </div>
    </div>
  );
};

export { RelationshipsSearchBar };
