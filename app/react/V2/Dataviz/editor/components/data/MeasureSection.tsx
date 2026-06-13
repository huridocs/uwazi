import React from 'react';
import { Select } from '#V2/Components/Forms/Select.js';
import type { MeasureSpec } from '#V2/Dataviz/types/definition.js';

type MeasureSectionProps = {
  measure: MeasureSpec;
  onChange: (measure: MeasureSpec) => void;
};

const MeasureSection = ({ measure, onChange }: MeasureSectionProps) => (
  <section className="flex flex-col gap-3">
    <h3 className="text-sm font-semibold text-ink">Measure (Y-axis / values)</h3>
    <Select
      id="measure-aggregation"
      label="Aggregation"
      value={measure.aggregation}
      options={[
        { value: 'count', label: 'Count entities' },
        { value: 'sum', label: 'Sum' },
        { value: 'avg', label: 'Average' },
        { value: 'min', label: 'Minimum' },
        { value: 'max', label: 'Maximum' },
      ]}
      onChange={e =>
        onChange({
          ...measure,
          aggregation: e.target.value as MeasureSpec['aggregation'],
          countMode: 'all',
        })
      }
    />
  </section>
);

export { MeasureSection };
