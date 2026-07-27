/* eslint-disable react/no-multi-comp */
import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { FilterDrawerButton } from '#V2/Components/UI/FilterDrawerButton.js';
import { QuerySearchBar } from '#V2/Components/UI/QuerySearchBar.js';
import { RelationshipsActiveFilterChips } from './RelationshipsActiveFilterChips.js';
import { RelationshipsDisplayMenu } from '../controls/RelationshipsDisplayMenu.js';
import { RelationshipsViewControl } from '../controls/RelationshipsViewControl.js';
import {
  useRelationshipsPanelFacetFilters,
  useRelationshipsPanelSearch,
  useRelationshipsPanelUi,
} from '#V2/Routes/Entity/Components/context/index.js';

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
        — <Translate>wildcard (many chars)</Translate>
      </li>
      <li>
        <code className="font-mono text-nano text-ink">
          <Translate>wom?n</Translate>
        </code>{' '}
        — <Translate>wildcard (one char)</Translate>
      </li>
      <li>
        <code className="font-mono text-nano text-ink">( ... )</code> —{' '}
        <Translate>group expressions</Translate>
      </li>
    </ul>
    <div className="mt-2 border-t border-border-soft pt-2 text-nano text-ink-tertiary">
      <Translate>e.g.</Translate>{' '}
      <code className="font-mono text-ink-secondary">status AND women NOT Nicaragua</code>
    </div>
  </>
);

const RelationshipsToolbarCluster = () => {
  const { activeFilterCount } = useRelationshipsPanelFacetFilters();
  const { setFiltersDrawerOpen } = useRelationshipsPanelUi();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <RelationshipsViewControl />
      <RelationshipsDisplayMenu />
      <FilterDrawerButton
        activeCount={activeFilterCount}
        onClick={() => setFiltersDrawerOpen(true)}
        size="md"
      />
    </div>
  );
};

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
      rightSlot={<RelationshipsToolbarCluster />}
    />
  );
};

export { RelationshipsSearchBar };
