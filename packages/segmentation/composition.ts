import type { Register } from '../../app/queueRegistry.js';
import type { Application } from 'express';
import { QueueIdleSegmentationsFactory } from './infrastructure/factories/QueueIdleSegmentationsFactory.js';
import { SegmentationResultListenerFactory } from './infrastructure/factories/SegmentationResultListenerFactory.js';
import { RequestSegmentationJobHandler } from './infrastructure/jobs/RequestSegmentationJobHandler.js';
import { SaveSegmentationResultJobHandler } from './infrastructure/jobs/SaveSegmentationResultJobHandler.js';
import { SegmentationRoutes } from './infrastructure/http/SegmentationRoutes.js';
import { listeners } from './infrastructure/listeners.generated.js';

/** How the host wires the segmentation module in. */
class SegmentationComposition {
  /** The package's V2 listeners, for the host to register in every process. */
  static readonly listeners = listeners;

  static registerJobs(register: Register) {
    register(RequestSegmentationJobHandler, async () => new RequestSegmentationJobHandler());

    register(SaveSegmentationResultJobHandler, async () => new SaveSegmentationResultJobHandler());
  }

  /** The worker's consumer of the segmentation service's results queue. */
  static createResultListener() {
    return SegmentationResultListenerFactory.default();
  }

  /** Requests a tenant's idle segmentations, for `uwazi segmentation queue-idle`. */
  static queueIdleSegmentations() {
    return QueueIdleSegmentationsFactory.default();
  }

  static registerRoutes(app: Application) {
    SegmentationRoutes.register(app);
  }
}

export { SegmentationComposition };
