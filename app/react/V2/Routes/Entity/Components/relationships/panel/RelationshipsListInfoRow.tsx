import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { RelationshipsPanelStats } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { RelationshipCollapseControls } from './RelationshipCollapseControls.js';

type RelationshipsListInfoRowProps = {
  stats: RelationshipsPanelStats;
};

const RelationshipsListInfoRow = ({ stats }: RelationshipsListInfoRowProps) => (
  <div className="@container flex shrink-0 flex-wrap items-center justify-between gap-2 pb-2 pt-1 text-micro text-ink-tertiary">
    <span className="shrink-0">
      <span className="font-semibold tabular-nums text-ink-secondary">{stats.aggregates}</span>{' '}
      <Translate>relationships</Translate>,{' '}
      <span className="font-semibold tabular-nums text-ink-secondary">{stats.entities}</span>{' '}
      <Translate>entities</Translate>,{' '}
      <span className="font-semibold tabular-nums text-ink-secondary">{stats.references}</span>{' '}
      <Translate>references</Translate>
    </span>
    <RelationshipCollapseControls />
  </div>
);

export { RelationshipsListInfoRow };
