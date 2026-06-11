import React from 'react';
import {
  ChartBarIcon,
  ChartPieIcon,
  ListBulletIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { Checkbox } from '#V2/Components/Forms/Checkbox.js';
import { Select } from '#V2/Components/Forms/Select.js';
import { InputField } from '#V2/Components/Forms/InputField.js';
import { CHART_TYPE_LABELS, type ChartType } from '#V2/Dataviz/types/chartTypes.js';
import { getSupportedChartTypes } from '#V2/Dataviz/utils/getSupportedChartTypes.js';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';

const CHART_ICONS: Partial<Record<ChartType, React.ComponentType<{ className?: string }>>> = {
  pie: ChartPieIcon,
  donut: ChartPieIcon,
  bar: ChartBarIcon,
  horizontal_bar: ChartBarIcon,
  stacked_bar: ChartBarIcon,
  list: ListBulletIcon,
  gauge: SignalIcon,
  line: ChartBarIcon,
  area: ChartBarIcon,
};

type ChartTabProps = {
  definition: DatavizDefinition;
  onPatchChart: (patch: Partial<DatavizDefinition['chart']>) => void;
};

const ChartTab = ({ definition, onPatchChart }: ChartTabProps) => {
  const availability = getSupportedChartTypes(
    definition.query.dimensions,
    definition.query.measures
  );
  const { chart } = definition;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink">Chart type</h3>
        <div className="grid grid-cols-3 gap-2">
          {availability.map(item => {
            const Icon = CHART_ICONS[item.type] || ChartBarIcon;
            const selected = chart.type === item.type;
            return (
              <button
                key={item.type}
                type="button"
                disabled={!item.enabled}
                title={item.enabled ? CHART_TYPE_LABELS[item.type] : item.reason}
                onClick={() => item.enabled && onPatchChart({ type: item.type })}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs ${
                  selected
                    ? 'border-ink bg-warm text-ink'
                    : item.enabled
                      ? 'border-border hover:bg-vellum text-ink'
                      : 'border-border-soft text-ink-muted cursor-not-allowed opacity-50'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span>{CHART_TYPE_LABELS[item.type]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">Chart options</h3>
        <Checkbox
          name="show-legend"
          label="Show legend"
          checked={chart.showLegend ?? true}
          onChange={e => onPatchChart({ showLegend: (e.target as HTMLInputElement).checked })}
        />
        <Checkbox
          name="show-tooltip"
          label="Show tooltip"
          checked={chart.showTooltip ?? true}
          onChange={e => onPatchChart({ showTooltip: (e.target as HTMLInputElement).checked })}
        />
        <Checkbox
          name="show-labels"
          label="Show labels on chart"
          checked={chart.showLabels ?? true}
          onChange={e => onPatchChart({ showLabels: (e.target as HTMLInputElement).checked })}
        />
        {(chart.type === 'pie' || chart.type === 'donut') && (
          <>
            <Select
              id="label-format"
              label="Label format"
              value={chart.pieOptions?.labelFormat || 'percentage'}
              options={[
                { value: 'percentage', label: 'Percentage' },
                { value: 'value', label: 'Value' },
                { value: 'both', label: 'Value and percentage' },
              ]}
              onChange={e =>
                onPatchChart({
                  pieOptions: {
                    ...chart.pieOptions,
                    labelFormat: e.target.value as 'percentage' | 'value' | 'both',
                  },
                })
              }
            />
            <InputField
              id="max-slices"
              label="Max number of slices"
              type="number"
              value={String(chart.pieOptions?.maxSlices ?? 10)}
              onChange={e =>
                onPatchChart({
                  pieOptions: {
                    ...chart.pieOptions,
                    maxSlices: Number(e.target.value) || 10,
                  },
                })
              }
            />
            <InputField
              id="others-label"
              label="Others label"
              value={chart.pieOptions?.othersLabel || 'Other'}
              onChange={e =>
                onPatchChart({
                  pieOptions: { ...chart.pieOptions, othersLabel: e.target.value },
                })
              }
            />
          </>
        )}
      </section>
    </div>
  );
};

export { ChartTab };
