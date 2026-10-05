import type { Application } from 'express';
import type { Register } from '../../app/queueRegistry.js';
import { OcrResultListenerFactory } from './infrastructure/factories/OcrResultListenerFactory.js';
import { ScheduleStaleOcrSweepJobFactory } from './infrastructure/factories/ScheduleStaleOcrSweepJobFactory.js';
import { OcrRoutes } from './infrastructure/http/OcrRoutes.js';
import { FailStaleOcrRecordsJobHandler } from './infrastructure/jobs/FailStaleOcrRecordsJobHandler.js';
import { SaveOcrResultJobHandler } from './infrastructure/jobs/SaveOcrResultJobHandler.js';
import { ScheduleStaleOcrSweepJob } from './infrastructure/jobs/ScheduleStaleOcrSweepJob.js';
import { ScheduleStaleOcrSweepJobScheduler } from './infrastructure/jobs/ScheduleStaleOcrSweepJobScheduler.js';
import { SubmitOcrJobHandler } from './infrastructure/jobs/SubmitOcrJobHandler.js';
import { listeners } from './infrastructure/listeners.generated.js';

/** How the host wires the OCR module in. */
class OcrComposition {
  /** The package's V2 listeners, for the host to register in every process. */
  static readonly listeners = listeners;

  static registerJobs(register: Register) {
    register(SubmitOcrJobHandler, async () => new SubmitOcrJobHandler());

    register(SaveOcrResultJobHandler, async () => new SaveOcrResultJobHandler());

    register(FailStaleOcrRecordsJobHandler, async () => new FailStaleOcrRecordsJobHandler());

    register(ScheduleStaleOcrSweepJob, async () => ScheduleStaleOcrSweepJobFactory.default());
  }

  /** The worker's consumer of the OCR service's results queue. */
  static createResultListener() {
    return OcrResultListenerFactory.default();
  }

  /** Makes sure the hourly stale sweep is queued; safe to call on every start. */
  static async ensureScheduled() {
    await ScheduleStaleOcrSweepJobScheduler.default().ensureScheduled();
  }

  static registerRoutes(app: Application) {
    OcrRoutes.register(app);
  }
}

export { OcrComposition };
