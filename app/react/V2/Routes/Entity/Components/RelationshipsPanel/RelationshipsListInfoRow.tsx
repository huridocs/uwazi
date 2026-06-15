import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { RelationshipsPanelStats } from '#V2/formatters/relationships/relationshipsPanelProjection.js';

type RelationshipsListInfoRowProps = {
  stats: RelationshipsPanelStats;
};

const RelationshipsListInfoRow = ({ stats }: RelationshipsListInfoRowProps) => (
  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 pb-2 pt-1 text-[11px] text-ink-tertiary">
    <span className="shrink-0">
      <span className="font-semibold tabular-nums text-ink-secondary">{stats.aggregates}</span>{' '}
      <Translate>relationships</Translate>,{' '}
      <span className="font-semibold tabular-nums text-ink-secondary">{stats.entities}</span>{' '}
      <Translate>entities</Translate>,{' '}
      <span className="font-semibold tabular-nums text-ink-secondary">{stats.references}</span>{' '}
      <Translate>references</Translate>
    </span>
    <div className="flex items-center gap-1">
      <span className="px-1 font-medium text-ink-muted">
        <Translate>Collapse all</Translate>
      </span>
      <span className="px-1 font-medium text-ink-muted">
        <Translate>Expand all</Translate>
      </span>
    </div>
  </div>
);

export { RelationshipsListInfoRow };
