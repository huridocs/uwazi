import { computeNextLockedUntil } from '#shared/dataviz/computeNextLockedUntil.js';

describe('computeNextLockedUntil', () => {
  it('should return a future timestamp for daily schedule', () => {
    const now = new Date('2026-06-02T10:00:00.000Z');
    const lockedUntil = computeNextLockedUntil(
      { refreshMode: 'snapshot_scheduled', schedule: 'daily', scheduleTime: '02:00', cronTimezone: 'UTC' },
      now
    );
    expect(lockedUntil).toBeGreaterThan(now.getTime());
  });
});
