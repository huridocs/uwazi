import type { Register } from '../../app/queueRegistry.js';
import type { Application } from 'express';
import { QueueIdleSegmentationsFactory } from './infrastructure/factories/QueueIdleSegmentationsFactory.js';
import { QueueSegmentationsOnFeatureEnabledFactory } from './infrastructure/factories/QueueSegmentationsOnFeatureEnabledFactory.js';
import { SegmentationResultListenerFactory } from './infrastructure/factories/SegmentationResultListenerFactory.js';
import { RequestSegmentationJobHandler } from './infrastructure/jobs/RequestSegmentationJobHandler.js';
import { SaveSegmentationResultJobHandler } from './infrastructure/jobs/SaveSegmentationResultJobHandler.js';
import { QueueSegmentationsOnFeatureEnabled } from './infrastructure/listeners/QueueSegmentationsOnFeatureEnabled.js';
import { SegmentationRoutes } from './infrastructure/http/SegmentationRoutes.js';
import { DeleteSegmentationsOnFileDeleted } from './infrastructure/listeners/DeleteSegmentationsOnFileDeleted.js';
import { SegmentOnFileCreated } from './infrastructure/listeners/SegmentOnFileCreated.js';
import { SegmentOnFileCreatedFactory } from './infrastructure/factories/SegmentOnFileCreatedFactory.js';
import { DeleteSegmentationsOnFileDeletedFactory } from './infrastructure/factories/DeleteSegmentationsOnFileDeletedFactory.js';

/** How the host wires the segmentation module in. */
class SegmentationComposition {
  static registerJobs(register: Register) {
    register(QueueSegmentationsOnFeatureEnabled.asJob(), async () =>
      QueueSegmentationsOnFeatureEnabledFactory.default()
    );

    register(SegmentOnFileCreated.asJob(), async () => SegmentOnFileCreatedFactory.default());

    register(DeleteSegmentationsOnFileDeleted.asJob(), async () =>
      DeleteSegmentationsOnFileDeletedFactory.default()
    );

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
