import React from 'react';
import { Select } from '#V2/Components/Forms/Select.js';
import type { DatavizQuery } from '#V2/Dataviz/types/definition.js';

type JoinModeSectionProps = {
  join?: DatavizQuery['join'];
  onChange: (join: DatavizQuery['join']) => void;
};

const JOIN_OPTIONS = [
  {
    value: 'compare',
    label: 'Compare side by side',
    description: 'Each data source becomes its own series on the chart.',
  },
  {
    value: 'union',
    label: 'Combine counts',
    description: 'Merge buckets from all sources into a single series.',
  },
] as const;

const JoinModeSection = ({ join, onChange }: JoinModeSectionProps) => {
  const mode = join?.type === 'union' ? 'union' : 'compare';
  const selected = JOIN_OPTIONS.find(option => option.value === mode);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-ink">Multi-source mode</h3>
      <Select
        id="dataviz-join-mode"
        label="How to combine sources"
        value={mode}
        options={JOIN_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
        onChange={e =>
          onChange({
            type: e.target.value as 'compare' | 'union',
          })
        }
      />
      {selected && <p className="text-xs text-ink-secondary">{selected.description}</p>}
    </section>
  );
};

export { JoinModeSection };
