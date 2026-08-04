/* eslint-disable react/no-multi-comp */
import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
    {children}
  </div>
);

type NoResultsProps = {
  searchTerm: string;
  onClear: () => void;
};

const NoSearch = () => (
  <Centered>
    <MagnifyingGlassIcon className="h-5 w-5 text-ink-muted" aria-hidden="true" />
    <span className="text-sm text-ink-tertiary">
      <Translate>Search this document</Translate>
    </span>
    <span className="text-xs text-ink-muted">
      <Translate>Matches show the passage and the page they are on.</Translate>
    </span>
  </Centered>
);

const NoResults = ({ searchTerm, onClear }: NoResultsProps) => (
  <Centered>
    <span dir="ltr" className="text-sm text-ink-tertiary">
      <Translate>No matches for</Translate>{' '}
      <span className="font-medium text-ink-secondary">“{searchTerm}”</span>
    </span>
    <button
      type="button"
      onClick={onClear}
      className="cursor-pointer rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
    >
      <Translate>Clear search</Translate>
    </button>
  </Centered>
);

const SearchError = () => (
  <Centered>
    <span className="text-sm text-ink-tertiary">
      <Translate>An error occurred</Translate>
    </span>
    <span className="text-xs text-ink-muted">
      <Translate>This search could not be completed. Try again later.</Translate>
    </span>
  </Centered>
);

export { NoSearch, NoResults, SearchError };
