import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import { CHART_TYPE_LABELS } from '#V2/Dataviz/types/chartTypes.js';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';

type DetailsPanelProps = {
  definition: DatavizDefinition;
};

const DetailsPanel = ({ definition }: DetailsPanelProps) => {
  const templates = useAtomValue(templatesAtom);
  const templateName = useMemo(() => {
    const id = definition.query.sources[0]?.templateId;
    return templates.find(t => t._id === id)?.name || '—';
  }, [definition.query.sources, templates]);

  const primary = definition.query.dimensions[0];
  const secondary = definition.query.dimensions[1];
  const dimensionLabel = primary?.property || '—';
  const secondaryLabel = secondary?.property;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-ink">Details</h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-ink-secondary">ID</dt>
          <dd className="truncate font-mono text-xs text-ink">{definition.id}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-secondary">Template</dt>
          <dd className="text-ink">{templateName}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-secondary">Primary dim.</dt>
          <dd className="text-ink">{dimensionLabel}</dd>
        </div>
        {secondaryLabel && (
          <div className="flex justify-between gap-2">
            <dt className="text-ink-secondary">Second dim.</dt>
            <dd className="text-ink">{secondaryLabel}</dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-ink-secondary">Chart</dt>
          <dd className="text-ink">{CHART_TYPE_LABELS[definition.chart.type]}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-secondary">Refresh</dt>
          <dd className="text-ink">{definition.refresh.refreshMode}</dd>
        </div>
      </dl>
    </section>
  );
};

export { DetailsPanel };
