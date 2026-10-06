import { CleanupOcrRecordsOnFilesDeleted } from '../listeners/CleanupOcrRecordsOnFilesDeleted.js';
import { CleanupOcrRecordsOfFilesFactory } from './CleanupOcrRecordsOfFilesFactory.js';

class CleanupOcrRecordsOnFilesDeletedFactory {
  static default(): CleanupOcrRecordsOnFilesDeleted {
    return new CleanupOcrRecordsOnFilesDeleted({
      cleanupOcrRecordsOfFiles: CleanupOcrRecordsOfFilesFactory.default(),
    });
  }
}

export { CleanupOcrRecordsOnFilesDeletedFactory };
