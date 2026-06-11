import React from 'react';
import { Select } from '#V2/Components/Forms/Select.js';
import type { DatavizDefinition, RefreshMode } from '#V2/Dataviz/types/definition.js';
import type { RefreshModeConstraints } from '#V2/Dataviz/utils/refreshModeConstraints.js';

type RefreshTabProps = {
  definition: DatavizDefinition;
  constraints: RefreshModeConstraints;
  onPatchRefresh: (patch: Partial<DatavizDefinition['refresh']>) => void;
};

const REFRESH_OPTIONS: {
  value: RefreshMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'live',
    label: 'Live (always up to date)',
    description: 'Data is fetched when the visualization is loaded.',
  },
  {
    value: 'snapshot_manual',
    label: 'Snapshot (manual)',
    description: 'Data is refreshed only when you click Refresh now.',
  },
  {
    value: 'snapshot_scheduled',
    label: 'Snapshot (scheduled)',
    description: 'Data is pre-calculated on a schedule.',
  },
];

const RefreshTab = ({ definition, constraints, onPatchRefresh }: RefreshTabProps) => {
  const { refresh } = definition;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">Refresh mode</h3>
        {REFRESH_OPTIONS.map(option => {
          const isLive = option.value === 'live';
          const isDisabled = isLive && !constraints.liveAllowed;
          const isSelected = refresh.refreshMode === option.value;

          return (
            <div key={option.value} className="flex flex-col gap-1">
              <label
                className={`flex gap-3 rounded-lg border p-3 ${
                  isDisabled
                    ? 'cursor-not-allowed border-border bg-vellum opacity-60'
                    : isSelected
                      ? 'cursor-pointer border-ink bg-warm'
                      : 'cursor-pointer border-border hover:bg-vellum'
                }`}
              >
                <input
                  type="radio"
                  name="refresh-mode"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => onPatchRefresh({ refreshMode: option.value })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-ink">{option.label}</p>
                  <p className="text-xs text-ink-secondary">{option.description}</p>
                </div>
              </label>
              {isDisabled && constraints.messages.length > 0 && (
                <ul className="ml-1 list-disc pl-5 text-xs text-ink-secondary">
                  {constraints.messages.map(message => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      {refresh.refreshMode === 'snapshot_scheduled' && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-ink">Schedule</h3>
          <Select
            id="schedule-frequency"
            label="Frequency"
            value={refresh.schedule || 'daily'}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
            onChange={e =>
              onPatchRefresh({
                schedule: e.target.value as DatavizDefinition['refresh']['schedule'],
              })
            }
          />
          <label className="flex flex-col gap-1 text-sm text-ink-secondary">
            Time
            <input
              id="schedule-time"
              type="time"
              value={refresh.scheduleTime || '02:00'}
              onChange={e => onPatchRefresh({ scheduleTime: e.target.value })}
              className="rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
          <Select
            id="timezone"
            label="Timezone"
            value={refresh.cronTimezone || 'UTC'}
            options={[{ value: 'UTC', label: '(UTC) Coordinated Universal Time' }]}
            onChange={e => onPatchRefresh({ cronTimezone: e.target.value })}
          />
        </section>
      )}
    </div>
  );
};

export { RefreshTab };
