import type { Register } from '../../app/queueRegistry.js';
import type { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { QueueSegmentationsOnFeatureEnabledFactory } from './infrastructure/factories/QueueSegmentationsOnFeatureEnabledFactory.js';
import { QueueSegmentationsOnFeatureEnabled } from './infrastructure/listeners/QueueSegmentationsOnFeatureEnabled.js';
import { SegmentOnFileCreated } from './infrastructure/listeners/SegmentOnFileCreated.js';

/** How the host wires the segmentation module in. */
class SegmentationComposition {
  static registerJobs(register: Register) {
    register(QueueSegmentationsOnFeatureEnabled.asJob(), async () =>
      QueueSegmentationsOnFeatureEnabledFactory.default()
    );
  }

  static registerListeners(eventsBus: EventsBus) {
    SegmentOnFileCreated.register(eventsBus);
  }
}

export { SegmentationComposition };
