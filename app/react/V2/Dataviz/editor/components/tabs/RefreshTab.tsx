import React, { useEffect, useState } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/Button.js';
import { Select } from '#V2/Components/Forms/Select.js';
import { useDatavizApi } from '#V2/Dataviz/api/DatavizApiContext.js';
import { isPersistedId } from '#V2/Dataviz/api/httpDatavizApi.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
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
    description: 'Data is fetched from your collection each time the visualization is loaded.',
  },
  {
    value: 'snapshot_manual',
    label: 'Snapshot (manual)',
    description:
      'Uses a saved copy of your data. Refresh when your collection has new or updated entries.',
  },
  {
    value: 'snapshot_scheduled',
    label: 'Snapshot (scheduled)',
    description:
      'Uses a saved copy that is updated on a schedule. You can also refresh manually after adding data.',
  },
];

const SNAPSHOT_MODES = new Set<RefreshMode>(['snapshot_manual', 'snapshot_scheduled']);

const SCHEDULED_REFRESH_DEFAULTS: Partial<DatavizDefinition['refresh']> = {
  schedule: 'daily',
  scheduleTime: '02:00',
  cronTimezone: 'UTC',
};

const SNAPSHOT_REFRESH_COOLDOWN_MS = 10_000;

const isSnapshotRecentlyRefreshed = (lastRefreshedAt?: string): boolean => {
  if (!lastRefreshedAt) {
    return false;
  }
  return Date.now() - new Date(lastRefreshedAt).getTime() < SNAPSHOT_REFRESH_COOLDOWN_MS;
};

const formatRefreshedAt = (value?: string) => {
  if (!value) return null;
  return new Date(value).toLocaleString();
};

const RefreshTab = ({ definition, constraints, onPatchRefresh }: RefreshTabProps) => {
  const api = useDatavizApi();
  const { notify } = useRequestStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [cooldownTick, setCooldownTick] = useState(0);
  const { refresh } = definition;
  const canRefreshSnapshot = isPersistedId(definition.id);
  void cooldownTick;
  const recentlyRefreshed = isSnapshotRecentlyRefreshed(refresh.lastRefreshedAt);

  useEffect(() => {
    if (!refresh.lastRefreshedAt) {
      return undefined;
    }

    const elapsed = Date.now() - new Date(refresh.lastRefreshedAt).getTime();
    const remaining = SNAPSHOT_REFRESH_COOLDOWN_MS - elapsed;
    if (remaining <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCooldownTick(value => value + 1);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [refresh.lastRefreshedAt, cooldownTick]);

  const handleRefreshNow = async () => {
    if (!canRefreshSnapshot || refreshing || recentlyRefreshed) {
      return;
    }

    setRefreshing(true);
    try {
      await api.refreshSnapshot(definition.id);
      const updated = await api.getDefinition(definition.id);
      onPatchRefresh({
        lastRefreshedAt: updated.refresh.lastRefreshedAt,
        nextScheduledAt: updated.refresh.nextScheduledAt,
      });
      notify('success', t('System', 'Visualization data updated from your collection.', null, false));
    } catch {
      notify('error', t('System', 'An error occurred', null, false));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">Refresh mode</h3>
        {REFRESH_OPTIONS.map(option => {
          const isLive = option.value === 'live';
          const isDisabled = isLive && !constraints.liveAllowed;
          const isSelected = refresh.refreshMode === option.value;
          const showSnapshotActions = SNAPSHOT_MODES.has(option.value) && isSelected;

          return (
            <div key={option.value} className="flex flex-col gap-1">
              <div
                className={`flex flex-col gap-3 rounded-lg border p-3 ${
                  isDisabled
                    ? 'border-border bg-vellum opacity-60'
                    : isSelected
                      ? 'border-ink bg-warm'
                      : 'border-border'
                }`}
              >
                <label
                  className={`flex gap-3 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="radio"
                    name="refresh-mode"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() =>
                      onPatchRefresh({
                        refreshMode: option.value,
                        ...(option.value === 'snapshot_scheduled'
                          ? {
                              schedule: refresh.schedule ?? SCHEDULED_REFRESH_DEFAULTS.schedule,
                              scheduleTime:
                                refresh.scheduleTime ?? SCHEDULED_REFRESH_DEFAULTS.scheduleTime,
                              cronTimezone: SCHEDULED_REFRESH_DEFAULTS.cronTimezone,
                            }
                          : {}),
                      })
                    }
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{option.label}</p>
                    <p className="text-xs text-ink-secondary">{option.description}</p>
                  </div>
                </label>

                {showSnapshotActions && (
                  <div className="flex flex-col gap-2 border-t border-border-soft pt-3 pl-7">
                    {option.value === 'snapshot_manual' && (
                      <p className="text-xs text-ink-secondary">
                        Re-runs the query against your current collection. Use this after importing
                        or editing entities—not when changing chart settings (save handles that).
                      </p>
                    )}
                    {option.value === 'snapshot_scheduled' && (
                      <p className="text-xs text-ink-secondary">
                        Refresh manually when you have added data and cannot wait for the next
                        scheduled run.
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      onClick={handleRefreshNow}
                      disabled={!canRefreshSnapshot || refreshing || recentlyRefreshed}
                    >
                      {refreshing ? (
                        <Translate>Updating…</Translate>
                      ) : (
                        <Translate>Update from collection</Translate>
                      )}
                    </Button>
                    {!canRefreshSnapshot && (
                      <p className="text-xs text-amber-700">
                        Save the visualization before refreshing.
                      </p>
                    )}
                    {canRefreshSnapshot && recentlyRefreshed && (
                      <p className="text-xs text-ink-muted">
                        Data was updated recently. You can refresh again in a few seconds.
                      </p>
                    )}

                    {refresh.lastRefreshedAt && (
                      <p className="text-xs text-ink-muted">
                        Last updated from collection: {formatRefreshedAt(refresh.lastRefreshedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
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
            Time (UTC)
            <input
              id="schedule-time"
              type="time"
              value={refresh.scheduleTime || '02:00'}
              onChange={e => onPatchRefresh({ scheduleTime: e.target.value })}
              className="rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
          <p className="text-xs text-ink-secondary">
            Schedules run in UTC (Coordinated Universal Time).
          </p>
        </section>
      )}
    </div>
  );
};

export { RefreshTab };
