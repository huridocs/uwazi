import { DateTime } from 'luxon';
import type { DatavizRefreshPolicy } from '#shared/types/datavizSchema.js';

const parseScheduleTime = (scheduleTime = '02:00') => {
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
};

const nextRunInTimezone = (
  schedule: NonNullable<DatavizRefreshPolicy['schedule']>,
  scheduleTime: string,
  timezone: string,
  from: DateTime
): DateTime => {
  const { hours, minutes } = parseScheduleTime(scheduleTime);
  let candidate = from
    .setZone(timezone)
    .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

  if (candidate <= from) {
    if (schedule === 'daily') {
      candidate = candidate.plus({ days: 1 });
    } else if (schedule === 'weekly') {
      candidate = candidate.plus({ weeks: 1 });
    } else {
      candidate = candidate.plus({ months: 1 });
    }
  }

  return candidate;
};

export const computeNextLockedUntil = (
  refresh: DatavizRefreshPolicy,
  now: Date = new Date()
): number => {
  const schedule = refresh.schedule ?? 'daily';
  const scheduleTime = refresh.scheduleTime ?? '02:00';
  const timezone = refresh.cronTimezone ?? 'UTC';
  const from = DateTime.fromJSDate(now);

  return nextRunInTimezone(schedule, scheduleTime, timezone, from).toMillis();
};

export const computeNextScheduledAtIso = (
  refresh: DatavizRefreshPolicy,
  now: Date = new Date()
): string => new Date(computeNextLockedUntil(refresh, now)).toISOString();
