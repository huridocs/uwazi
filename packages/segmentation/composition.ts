import type { Register } from '../../app/queueRegistry.js';
import type { Application } from 'express';
import type { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { QueueSegmentationsOnFeatureEnabledFactory } from './infrastructure/factories/QueueSegmentationsOnFeatureEnabledFactory.js';
import { SegmentationResultListenerFactory } from './infrastructure/factories/SegmentationResultListenerFactory.js';
import { RequestSegmentationJobHandler } from './infrastructure/jobs/RequestSegmentationJobHandler.js';
import { SaveSegmentationResultJobHandler } from './infrastructure/jobs/SaveSegmentationResultJobHandler.js';
import { QueueSegmentationsOnFeatureEnabled } from './infrastructure/listeners/QueueSegmentationsOnFeatureEnabled.js';
import { SegmentationRoutes } from './infrastructure/http/SegmentationRoutes.js';
import { DeleteSegmentationsOnFilesDeleted } from './infrastructure/listeners/DeleteSegmentationsOnFilesDeleted.js';
import { SegmentOnFileCreated } from './infrastructure/listeners/SegmentOnFileCreated.js';

/** How the host wires the segmentation module in. */
class SegmentationComposition {
  static registerJobs(register: Register) {
    register(QueueSegmentationsOnFeatureEnabled.asJob(), async () =>
      QueueSegmentationsOnFeatureEnabledFactory.default()
    );

    register(RequestSegmentationJobHandler, async () => new RequestSegmentationJobHandler());

    register(SaveSegmentationResultJobHandler, async () => new SaveSegmentationResultJobHandler());
  }

  /** The worker's consumer of the segmentation service's results queue. */
  static createResultListener() {
    return SegmentationResultListenerFactory.default();
  }

  static registerListeners(eventsBus: EventsBus) {
    SegmentOnFileCreated.register(eventsBus);
    DeleteSegmentationsOnFilesDeleted.register(eventsBus);
  }

  static registerRoutes(app: Application) {
    SegmentationRoutes.register(app);
  }
}

export { SegmentationComposition };
