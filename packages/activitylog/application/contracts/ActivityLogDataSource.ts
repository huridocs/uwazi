import { ActivityLogEntry } from '../../domain/ActivityLogEntry.js';

/** Where the current tenant's activity log is written. Entries are only ever added. */
interface ActivityLogDataSource {
  append(entry: ActivityLogEntry): Promise<void>;
}

export type { ActivityLogDataSource };
