import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { QuerySearchBar } from '#V2/Components/UI/QuerySearchBar.js';
import { RelationshipsActiveFilterChips } from './RelationshipsActiveFilterChips.js';
import { useRelationshipsPanelFilters } from '../EntityScopedProvider.js';

const RelationshipsSearchTips = () => (
  <>
    <div className="mb-1.5 text-xs font-semibold text-ink">
      <Translate>Search tips</Translate>
    </div>
    <ul className="space-y-1 text-ink-secondary">
      <li>
        <code className="font-mono text-[10px] text-ink">AND OR NOT</code> — boolean
      </li>
      <li>
        <code className="font-mono text-[10px] text-ink">&quot;exact phrase&quot;</code> — match
        verbatim
      </li>
      <li>
        <code className="font-mono text-[10px] text-ink">stat*</code> — wildcard
      </li>
      <li>
        <code className="font-mono text-[10px] text-ink">wom?n</code> — one character
      </li>
      <li>
        <code className="font-mono text-[10px] text-ink">( ... )</code> — group expressions
      </li>
    </ul>
  </>
);

const RelationshipsSearchBar = () => {
  const { search: query, setSearch: setQuery } = useRelationshipsPanelFilters();

  return (
    <QuerySearchBar
      value={query}
      onChange={setQuery}
      placeholder={t('System', 'Search  •  AND, OR, NOT, "exact", wild*', null, false)}
      ariaLabel={t('System', 'Search relationships', null, false)}
      clearAriaLabel={t('System', 'Clear search', null, false)}
      tipsAriaLabel={t('System', 'Search tips', null, false)}
      inlineSlot={<RelationshipsActiveFilterChips />}
      tipsContent={<RelationshipsSearchTips />}
    />
  );
};

export { RelationshipsSearchBar };
