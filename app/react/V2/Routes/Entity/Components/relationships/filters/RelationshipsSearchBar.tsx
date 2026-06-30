/* eslint-disable react/no-multi-comp */
import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { QuerySearchBar } from '#V2/Components/UI/QuerySearchBar.js';
import { RelationshipsActiveFilterChips } from './RelationshipsActiveFilterChips.js';
import { useRelationshipsPanelSearch } from '#V2/Routes/Entity/Components/context/index.js';

const RelationshipsSearchTips = () => (
  <>
    <div className="mb-1.5 text-xs font-semibold text-ink">
      <Translate>Search tips</Translate>
    </div>
    <ul className="space-y-1 text-ink-secondary">
      <li>
        <code className="font-mono text-nano text-ink">
          <Translate>AND OR NOT</Translate>
        </code>{' '}
        — <Translate>boolean</Translate>
      </li>
      <li>
        <code className="font-mono text-nano text-ink">
          &quot;<Translate>exact phrase</Translate>&quot;
        </code>{' '}
        — <Translate>match verbatim</Translate>
      </li>
      <li>
        <code className="font-mono text-nano text-ink">
          <Translate>stat*</Translate>
        </code>{' '}
        — <Translate>wildcard</Translate>
      </li>
      <li>
        <code className="font-mono text-nano text-ink">
          <Translate>wom?n</Translate>
        </code>{' '}
        <Translate>one character</Translate>
      </li>
      <li>
        <code className="font-mono text-nano text-ink">( ... )</code> —{' '}
        <Translate>group expressions</Translate>
      </li>
    </ul>
  </>
);

const RelationshipsSearchBar = () => {
  const { search: query, setSearch: setQuery } = useRelationshipsPanelSearch();

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
