import { config } from '#api/config.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { storage } from '#api/files/index.js';
import { ArchiveActivityOverflow } from '../../application/ArchiveActivityOverflow.js';
import { ActivityLogDataSourceFactory } from './ActivityLogDataSourceFactory.js';

type Limits = { maxRows?: number; chunkRows?: number };

/**
 * How many entries a tenant keeps is a system setting, `ACTIVITY_LOG_MAX_ROWS`. Archives go to
 * the tenant's activity log folder through the files module's storage, on disk or S3.
 */
class ArchiveActivityOverflowFactory {
  static default(limits: Limits = {}): ArchiveActivityOverflow {
    return new ArchiveActivityOverflow({
      activityLogDS: ActivityLogDataSourceFactory.default(),
      storage,
      maxRows: limits.maxRows ?? config.activityLog.maxRows,
      chunkRows: limits.chunkRows ?? ArchiveActivityOverflow.CHUNK_ROWS,
      enabled: Boolean(ExecutionContext.currentTenant.featureFlags?.postgresCore),
    });
  }
}

export { ArchiveActivityOverflowFactory };
