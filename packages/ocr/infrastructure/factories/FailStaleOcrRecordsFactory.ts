import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { FailStaleOcrRecords } from '../../application/FailStaleOcrRecords.js';
import { OcrRecordDataSourceFactory } from './OcrRecordDataSourceFactory.js';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

type Overrides = {
  sockets?: WebSockets;
  now?: () => number;
  batchSize?: number;
};

class FailStaleOcrRecordsFactory {
  static default(overrides: Overrides = {}): FailStaleOcrRecords {
    return new FailStaleOcrRecords({
      ocrDS: OcrRecordDataSourceFactory.default(),
      sockets: overrides.sockets ?? new V1WebSocketsWrapper(),
      tenantName: ExecutionContext.currentTenant.name,
      now: overrides.now ?? Date.now,
      maxAgeMs: MAX_AGE_MS,
      batchSize: overrides.batchSize ?? BATCH_SIZE,
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { FailStaleOcrRecordsFactory };
