import type { Register } from '../../app/queueRegistry.js';
import type { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { QueueSegmentationsOnFeatureEnabledFactory } from './infrastructure/factories/QueueSegmentationsOnFeatureEnabledFactory.js';
import { RequestSegmentationFactory } from './infrastructure/factories/RequestSegmentationFactory.js';
import { SaveSegmentationResultFactory } from './infrastructure/factories/SaveSegmentationResultFactory.js';
import { SegmentationResultListenerFactory } from './infrastructure/factories/SegmentationResultListenerFactory.js';
import { RequestSegmentationJobHandler } from './infrastructure/jobs/RequestSegmentationJobHandler.js';
import { SaveSegmentationResultJobHandler } from './infrastructure/jobs/SaveSegmentationResultJobHandler.js';
import { QueueSegmentationsOnFeatureEnabled } from './infrastructure/listeners/QueueSegmentationsOnFeatureEnabled.js';
import { SegmentOnFileCreated } from './infrastructure/listeners/SegmentOnFileCreated.js';

/** How the host wires the segmentation module in. */
class SegmentationComposition {
  static registerJobs(register: Register) {
    register(QueueSegmentationsOnFeatureEnabled.asJob(), async () =>
      QueueSegmentationsOnFeatureEnabledFactory.default()
    );

    register(
      RequestSegmentationJobHandler,
      async () =>
        new RequestSegmentationJobHandler({
          requestSegmentation: RequestSegmentationFactory.default(),
        })
    );

    register(
      SaveSegmentationResultJobHandler,
      async () =>
        new SaveSegmentationResultJobHandler({
          saveSegmentationResult: SaveSegmentationResultFactory.default(),
        })
    );
  }

  /** The worker's consumer of the segmentation service's results queue. */
  static createResultListener() {
    return SegmentationResultListenerFactory.default();
  }

  static registerListeners(eventsBus: EventsBus) {
    SegmentOnFileCreated.register(eventsBus);
  }
}

export { SegmentationComposition };
