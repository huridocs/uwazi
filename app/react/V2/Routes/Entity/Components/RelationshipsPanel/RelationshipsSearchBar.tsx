import React, { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { IconButton } from '#V2/Components/UI/IconButton.js';
import { relationshipsPanelSearchAtom } from './relationshipsPanelFiltersAtom.js';
import { RelationshipsActiveFilterChips } from './RelationshipsActiveFilterChips.js';

const RelationshipsSearchBar = () => {
  const [query, setQuery] = useAtom(relationshipsPanelSearchAtom);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    if (!hintOpen) return undefined;
    const onClick = (event: MouseEvent) => {
      if (!hintRef.current?.contains(event.target as Node)) setHintOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [hintOpen]);

  return (
    <div className="flex items-center gap-1.5 pb-2 pt-0.5">
      <div
        className="flex min-h-8 min-w-0 flex-1 cursor-text flex-wrap items-center gap-1 rounded-md border border-border bg-warm py-1 pl-2 pr-2 transition-all focus-within:border-ink/40 focus-within:ring-2 focus-within:ring-ink/20"
        onClick={() => inputRef.current?.focus()}
      >
        <RelationshipsActiveFilterChips />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={t('System', 'Search  •  AND, OR, NOT, "exact", wild*', null, false)}
          aria-label={t('System', 'Search relationships', null, false)}
          className="h-6 min-w-[100px] flex-1 bg-transparent text-xs font-medium placeholder:text-ink-muted focus:outline-none"
        />
        {query && (
          <IconButton
            variant="clear"
            aria-label={t('System', 'Clear search', null, false)}
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            <XMarkIcon className="h-3 w-3" />
          </IconButton>
        )}
        <div ref={hintRef} className="relative shrink-0">
          <IconButton
            variant="subtle"
            aria-label={t('System', 'Search tips', null, false)}
            ariaExpanded={hintOpen}
            onClick={event => {
              event.stopPropagation();
              setHintOpen(open => !open);
            }}
          >
            {query ? (
              <QuestionMarkCircleIcon className="h-3.5 w-3.5" />
            ) : (
              <MagnifyingGlassIcon className="h-3.5 w-3.5" />
            )}
          </IconButton>
          {hintOpen && (
            <div
              role="dialog"
              aria-label={t('System', 'Search tips', null, false)}
              className="absolute right-0 top-full z-40 mt-1 w-64 rounded-md border border-border bg-paper p-3 text-[11px] leading-snug shadow-lg"
            >
              <div className="mb-1.5 text-xs font-semibold text-ink">
                <Translate>Search tips</Translate>
              </div>
              <ul className="space-y-1 text-ink-secondary">
                <li>
                  <code className="font-mono text-[10px] text-ink">AND OR NOT</code> — boolean
                </li>
                <li>
                  <code className="font-mono text-[10px] text-ink">&quot;exact phrase&quot;</code> —
                  match verbatim
                </li>
                <li>
                  <code className="font-mono text-[10px] text-ink">stat*</code> — wildcard
                </li>
                <li>
                  <code className="font-mono text-[10px] text-ink">wom?n</code> — one character
                </li>
                <li>
                  <code className="font-mono text-[10px] text-ink">( ... )</code> — group
                  expressions
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { RelationshipsSearchBar };
