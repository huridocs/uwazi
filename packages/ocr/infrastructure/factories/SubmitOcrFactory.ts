import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { OcrEngine } from '../../application/contracts/OcrEngine.js';
import { SubmitOcr } from '../../application/SubmitOcr.js';
// eslint-disable-next-line import/no-cycle
import { OcrJobsAdapter } from '../jobs/OcrJobsAdapter.js';
import { OcrEngineFactory } from './OcrEngineFactory.js';
import { OcrRecordDataSourceFactory } from './OcrRecordDataSourceFactory.js';

const MAX_BACKLOG = Number(process.env.OCR_QUEUE_DEPTH) || 200;
const RETRY_DELAY_MS = Number(process.env.OCR_RETRY_DELAY_MS) || 60_000;

type Overrides = {
  ocrEngine?: OcrEngine;
  sockets?: WebSockets;
  now?: () => number;
};

class SubmitOcrFactory {
  static default(overrides: Overrides = {}): SubmitOcr {
    return new SubmitOcr({
      ocrDS: OcrRecordDataSourceFactory.default(),
      ocrEngine: overrides.ocrEngine ?? OcrEngineFactory.default(),
      fileStorage: FileStorageFactory.default(),
      jobs: new OcrJobsAdapter({ jobsDispatcher: ExecutionContext.jobsDispatcher }),
      sockets: overrides.sockets ?? new V1WebSocketsWrapper(),
      tenantName: ExecutionContext.currentTenant.name,
      now: overrides.now ?? Date.now,
      maxBacklog: MAX_BACKLOG,
      retryDelayMs: RETRY_DELAY_MS,
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { SubmitOcrFactory };
