import React, { useEffect, useMemo, useState } from 'react';
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
  constraints: RefreshModeConstraints & { messages: string[] };
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

const SCHEDULE_TIME_STEP_MINUTES = 15;
const LOCAL_DEFAULT_START_HOUR = 1;
const LOCAL_DEFAULT_END_HOUR = 8;

const formatTimeHHMM = (hours: number, minutes: number) =>
  `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

const localTimeToUtcTime = (localTime: string) => {
  const [hours, minutes] = localTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return localTime;
  }

  const localDate = new Date();
  localDate.setHours(hours, minutes, 0, 0);
  return formatTimeHHMM(localDate.getUTCHours(), localDate.getUTCMinutes());
};

const utcTimeToLocalTime = (utcTime?: string) => {
  if (!utcTime) {
    return null;
  }

  const [hours, minutes] = utcTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const utcDate = new Date();
  utcDate.setUTCHours(hours, minutes, 0, 0);
  return formatTimeHHMM(utcDate.getHours(), utcDate.getMinutes());
};

const randomScheduledUtcTime = () => {
  const totalLocalMinutes =
    (LOCAL_DEFAULT_END_HOUR - LOCAL_DEFAULT_START_HOUR) * 60 + SCHEDULE_TIME_STEP_MINUTES;
  const totalSlots = Math.floor(totalLocalMinutes / SCHEDULE_TIME_STEP_MINUTES);
  const randomSlot = Math.floor(Math.random() * totalSlots);
  const minutesFromStart = randomSlot * SCHEDULE_TIME_STEP_MINUTES;
  const localHours = LOCAL_DEFAULT_START_HOUR + Math.floor(minutesFromStart / 60);
  const localMinutes = minutesFromStart % 60;
  const localTime = formatTimeHHMM(localHours, localMinutes);

  return localTimeToUtcTime(localTime);
};

const SCHEDULED_REFRESH_DEFAULTS: Omit<DatavizDefinition['refresh'], 'refreshMode'> = {
  schedule: 'daily',
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

const refreshOptionClassName = (isDisabled: boolean, isSelected: boolean) => {
  if (isDisabled) {
    return 'border-border bg-vellum opacity-60';
  }
  if (isSelected) {
    return 'border-ink bg-warm';
  }
  return 'border-border';
};

const RefreshTab = ({ definition, constraints, onPatchRefresh }: RefreshTabProps) => {
  const api = useDatavizApi();
  const { notify } = useRequestStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [cooldownTick, setCooldownTick] = useState(0);
  const defaultScheduledTime = useMemo(randomScheduledUtcTime, []);
  const { refresh } = definition;
  const canRefreshSnapshot = isPersistedId(definition.id);
  const recentlyRefreshed = useMemo(
    () => isSnapshotRecentlyRefreshed(refresh.lastRefreshedAt),
    [refresh.lastRefreshedAt, cooldownTick]
  );

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
      notify(
        'success',
        t('System', 'Visualization data updated from your collection.', null, false)
      );
    } catch {
      notify('error', t('System', 'An error occurred', null, false));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">
          <Translate>Refresh mode</Translate>
        </h3>
        {REFRESH_OPTIONS.map(option => {
          const isLive = option.value === 'live';
          const isDisabled = isLive && !constraints.liveAllowed;
          const isSelected = refresh.refreshMode === option.value;
          const showSnapshotActions = SNAPSHOT_MODES.has(option.value) && isSelected;

          return (
            <div key={option.value} className="flex flex-col gap-1">
              <div
                className={`flex flex-col gap-3 rounded-lg border p-3 ${refreshOptionClassName(isDisabled, isSelected)}`}
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
                              scheduleTime: refresh.scheduleTime ?? defaultScheduledTime,
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
                        <Translate>
                          Re-runs the query against your current collection. Use this after
                          importing or editing entities—not when changing chart settings (save
                          handles that).
                        </Translate>
                      </p>
                    )}
                    {option.value === 'snapshot_scheduled' && (
                      <p className="text-xs text-ink-secondary">
                        <Translate>
                          Refresh manually when you have added data and cannot wait for the next
                          scheduled run.
                        </Translate>
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
                        <Translate>Save the visualization before refreshing.</Translate>
                      </p>
                    )}
                    {canRefreshSnapshot && recentlyRefreshed && (
                      <p className="text-xs text-ink-muted">
                        <Translate>
                          Data was updated recently. You can refresh again in a few seconds.
                        </Translate>
                      </p>
                    )}

                    {refresh.lastRefreshedAt && (
                      <p className="text-xs text-ink-muted">
                        <Translate>Last updated from collection:</Translate>{' '}
                        {formatRefreshedAt(refresh.lastRefreshedAt)}
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
          <h3 className="text-sm font-semibold text-ink">
            <Translate>Schedule</Translate>
          </h3>
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
            <Translate>Time (UTC)</Translate>
            <input
              id="schedule-time"
              type="time"
              value={refresh.scheduleTime || defaultScheduledTime}
              onChange={e => onPatchRefresh({ scheduleTime: e.target.value })}
              className="rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink"
            />
            {utcTimeToLocalTime(refresh.scheduleTime || defaultScheduledTime) && (
              <p className="text-xs text-ink-muted">
                {utcTimeToLocalTime(refresh.scheduleTime || defaultScheduledTime)}{' '}
                <Translate>Local time</Translate>
              </p>
            )}
          </label>
          <p className="text-xs text-ink-secondary">
            <Translate>Schedules run in UTC (Coordinated Universal Time).</Translate>
          </p>
        </section>
      )}
    </div>
  );
};

export { RefreshTab };
