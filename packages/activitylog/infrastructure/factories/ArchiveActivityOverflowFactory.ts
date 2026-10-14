import { config } from '#api/config.js';
import { storage } from '#api/files/index.js';
import { ArchiveActivityOverflow } from '../../application/ArchiveActivityOverflow.js';
import { ActivityLogDataSourceFactory } from './ActivityLogDataSourceFactory.js';

/**
 * How many entries a tenant keeps and how many go in each archive are system settings,
 * `ACTIVITY_LOG_MAX_ROWS` and `ACTIVITY_LOG_CHUNK_ROWS`. Archives go to the tenant's activity log
 * folder through the files module's storage, on disk or S3.
 */
class ArchiveActivityOverflowFactory {
  static default(): ArchiveActivityOverflow {
    return new ArchiveActivityOverflow({
      activityLogDS: ActivityLogDataSourceFactory.default(),
      storage,
      maxRows: config.activityLog.maxRows,
      chunkRows: config.activityLog.chunkRows,
    });
  }
}

export { ArchiveActivityOverflowFactory };
