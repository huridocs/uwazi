import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { CleanupOcrRecordsOfFiles } from '../../application/CleanupOcrRecordsOfFiles.js';
import { OcrRecordDataSourceFactory } from './OcrRecordDataSourceFactory.js';

class CleanupOcrRecordsOfFilesFactory {
  static default(): CleanupOcrRecordsOfFiles {
    return new CleanupOcrRecordsOfFiles({
      ocrDS: OcrRecordDataSourceFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { CleanupOcrRecordsOfFilesFactory };
