import React from 'react';
import type { DatavizDataSourceKind } from '#shared/types/datavizSchema.js';

type DataSourceKindSectionProps = {
  value: DatavizDataSourceKind;
  onChange: (value: DatavizDataSourceKind) => void;
};

const DATA_SOURCE_OPTIONS: {
  value: DatavizDataSourceKind;
  label: string;
  description: string;
}[] = [
  {
    value: 'query',
    label: 'Query',
    description: 'Load data from entity templates.',
  },
  {
    value: 'manual',
    label: 'Manual',
    description: 'Paste chart-ready JSON.',
  },
];

const DataSourceKindSection = ({ value, onChange }: DataSourceKindSectionProps) => (
  <section className="flex flex-col gap-3">
    <h3 className="text-sm font-semibold text-ink">Data source</h3>
    <div className="flex gap-3">
      {DATA_SOURCE_OPTIONS.map(option => {
        const isSelected = value === option.value;

        return (
          <label
            key={option.value}
            className={`flex min-w-0 flex-1 cursor-pointer flex-col gap-3 rounded-lg border p-3 ${
              isSelected ? 'border-ink bg-warm' : 'border-border'
            }`}
          >
            <span className="flex gap-3">
              <input
                type="radio"
                name="data-source-kind"
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="mt-1 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{option.label}</span>
                <span className="mt-0.5 block text-xs text-ink-secondary">
                  {option.description}
                </span>
              </span>
            </span>
          </label>
        );
      })}
    </div>
  </section>
);

export { DataSourceKindSection };
