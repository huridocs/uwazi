import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import type { LibraryFacetBucket } from '#shared/types/librarySearch.js';
import type { FacetLookup } from '../lookupAggregation.js';
import { AndOrToggle } from './AndOrToggle.js';
import { FacetCard, FacetTree, type FacetMode } from './FacetCard.js';

const OPTIONS_CAP = 10;

type KeywordFacetProps = {
  title: ReactNode;
  buckets: LibraryFacetBucket[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
  open?: boolean;
  mode?: FacetMode;
  onModeChange?: (mode: FacetMode) => void;
  lookup?: FacetLookup;
  defaultExpanded?: boolean;
  alwaysSearch?: boolean;
  optionsCap?: number;
};

const matchesQuery = (bucket: LibraryFacetBucket, query: string): boolean => {
  if (!query) {
    return true;
  }
  const haystack = `${bucket.label || ''} ${bucket.id}`.toLowerCase();
  if (haystack.includes(query)) {
    return true;
  }
  return Boolean(bucket.values?.some(child => matchesQuery(child, query)));
};

const KeywordFacet = ({
  title,
  buckets,
  selected,
  onToggle,
  onClear,
  open = true,
  mode = 'or',
  onModeChange,
  lookup,
  defaultExpanded = false,
  alwaysSearch = false,
  optionsCap = OPTIONS_CAP,
}: KeywordFacetProps) => {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [lookupBuckets, setLookupBuckets] = useState<LibraryFacetBucket[] | null>(null);
  const [lookupTotal, setLookupTotal] = useState<number>();
  const [lookupError, setLookupError] = useState(false);

  useEffect(() => {
    if (!lookup) {
      return undefined;
    }
    let cancelled = false;
    const delay = search.trim() ? 200 : 0;
    const timer = window.setTimeout(() => {
      lookup(search.trim())
        .then(result => {
          if (cancelled) {
            return;
          }
          setLookupBuckets(result.buckets);
          setLookupTotal(result.total);
          setLookupError(false);
        })
        .catch(() => {
          if (!cancelled) {
            setLookupError(true);
          }
        });
    }, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [lookup, search]);

  const source = lookup ? (lookupBuckets ?? buckets) : buckets;
  const query = lookup ? '' : search.trim().toLowerCase();
  const filtered = useMemo(
    () => (query ? source.filter(bucket => matchesQuery(bucket, query)) : source),
    [query, source]
  );
  const groups = filtered.filter(bucket => bucket.id !== 'any');
  const anyBucket = source.find(bucket => bucket.id === 'any');
  const visibleGroups = showAll ? groups : groups.slice(0, optionsCap);
  const hidden = Math.max(0, groups.length - visibleGroups.length);
  const visible = anyBucket ? [...visibleGroups, anyBucket] : visibleGroups;
  const totalKnown = lookupTotal ?? groups.length;
  const showSearch =
    alwaysSearch || Boolean(lookup) || groups.length > optionsCap || totalKnown > optionsCap;

  const headerAction = onModeChange ? (
    <AndOrToggle value={mode} onChange={onModeChange} />
  ) : undefined;

  return (
    <FacetCard title={title} open={open} headerAction={headerAction} stacked={showSearch}>
      {showSearch && (
        <div className="px-1">
          <div className="relative flex h-8 items-center gap-1.5 rounded-md border border-border bg-warm px-2 transition-all focus-within:border-carbon/40 focus-within:ring-2 focus-within:ring-carbon/20">
            <input
              type="search"
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                setShowAll(false);
              }}
              placeholder="Search"
              aria-label="Search"
              className="min-w-0 flex-1 bg-transparent text-xs font-medium text-ink placeholder:text-ink-muted focus:outline-none"
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
                className="shrink-0 cursor-pointer text-ink-muted hover:text-ink"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            ) : (
              <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
            )}
          </div>
        </div>
      )}
      <div>
        {lookupError && (
          <p className="px-2 py-1 text-xs text-seal">
            <Translate>Could not load suggestions.</Translate>
          </p>
        )}
        {open && visible.length === 0 ? (
          <p className="px-2 py-1 text-xs text-ink-muted">
            <Translate>No matches.</Translate>
          </p>
        ) : (
          <FacetTree
            buckets={visible}
            selected={selected}
            onToggle={onToggle}
            defaultExpanded={defaultExpanded}
            forceExpanded={Boolean(query)}
          />
        )}
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="cursor-pointer px-2 py-1 text-xs font-medium text-ink-secondary underline underline-offset-2 hover:text-ink"
          >
            <Translate>Load more</Translate>
            {` (${hidden})`}
          </button>
        )}
        {showAll && groups.length > optionsCap && (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="cursor-pointer px-2 py-1 text-xs font-medium text-ink-tertiary underline underline-offset-2 hover:text-ink"
          >
            <Translate>Show less</Translate>
          </button>
        )}
      </div>
      {onClear && selected.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer px-2 py-1 text-xs font-medium text-ink-tertiary hover:text-ink"
        >
          <Translate>Clear</Translate>
        </button>
      )}
    </FacetCard>
  );
};

export { OPTIONS_CAP, KeywordFacet };
export type { KeywordFacetProps };
