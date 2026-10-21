import { config } from '#api/config.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { ArchiveActivityOverflow } from '../../application/ArchiveActivityOverflow.js';
import { ActivityLogDataSourceFactory } from './ActivityLogDataSourceFactory.js';

/**
 * How many entries a tenant keeps and how many go in each archive are system settings,
 * `ACTIVITY_LOG_MAX_ROWS` and `ACTIVITY_LOG_CHUNK_ROWS`. Archives go to the tenant's activity log
 * folder through the tenant's file storage, on disk or S3.
 */
class ArchiveActivityOverflowFactory {
  static default(): ArchiveActivityOverflow {
    return new ArchiveActivityOverflow({
      activityLogDS: ActivityLogDataSourceFactory.default(),
      fileStorage: FileStorageFactory.default(),
      maxRows: config.activityLog.maxRows,
      chunkRows: config.activityLog.chunkRows,
    });
  }
}

export { ArchiveActivityOverflowFactory };
