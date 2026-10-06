import type { Application } from 'express';
import type { Register } from '../../app/queueRegistry.js';
import { OcrResultListenerFactory } from './infrastructure/factories/OcrResultListenerFactory.js';
import { OcrRoutes } from './infrastructure/http/OcrRoutes.js';
import { SaveOcrResultJobHandler } from './infrastructure/jobs/SaveOcrResultJobHandler.js';
import { SubmitOcrJobHandler } from './infrastructure/jobs/SubmitOcrJobHandler.js';
import { listeners } from './infrastructure/listeners.generated.js';

/** How the host wires the OCR module in. */
class OcrComposition {
  static readonly listeners = listeners;

  static registerJobs(register: Register) {
    register(SubmitOcrJobHandler, async () => new SubmitOcrJobHandler());

    register(SaveOcrResultJobHandler, async () => new SaveOcrResultJobHandler());
  }

  static createResultListener() {
    return OcrResultListenerFactory.default();
  }

  static registerRoutes(app: Application) {
    OcrRoutes.register(app);
  }
}

export { OcrComposition };
