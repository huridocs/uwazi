import { ActivityLogEntry } from '../../domain/ActivityLogEntry.js';

/**
 * Where the current tenant's activity log is kept. Entries are added one at a time and never
 * changed; the oldest are taken out once they have been archived.
 */
interface ActivityLogDataSource {
  append(entry: ActivityLogEntry): Promise<void>;
  count(): Promise<number>;
  oldest(limit: number): Promise<ActivityLogEntry[]>;
  remove(entries: ActivityLogEntry[]): Promise<void>;
}

export type { ActivityLogDataSource };
