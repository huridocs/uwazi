import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
// eslint-disable-next-line import/no-cycle
import { OcrJobsAdapter } from '../jobs/OcrJobsAdapter.js';
import { OcrResultListener } from '../ocrService/OcrResultListener.js';

class OcrResultListenerFactory {
  /** Each outcome becomes a SaveOcrResult job in its tenant's queue. */
  static default(): OcrResultListener {
    return new OcrResultListener({
      saveResult: async outcome =>
        new OcrJobsAdapter({ jobsDispatcher: ExecutionContext.jobsDispatcher }).saveResult(outcome),
    });
  }
}

export { OcrResultListenerFactory };
