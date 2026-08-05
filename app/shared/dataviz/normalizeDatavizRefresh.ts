import type { DatavizRefreshPolicy } from '#shared/types/datavizSchema.js';

export const normalizeDatavizRefresh = (refresh: DatavizRefreshPolicy): DatavizRefreshPolicy => {
  if (refresh.refreshMode !== 'snapshot_scheduled') {
    return refresh;
  }

  return {
    ...refresh,
    schedule: refresh.schedule ?? 'daily',
    scheduleTime: refresh.scheduleTime ?? '02:00',
    cronTimezone: refresh.cronTimezone ?? 'UTC',
  };
};
