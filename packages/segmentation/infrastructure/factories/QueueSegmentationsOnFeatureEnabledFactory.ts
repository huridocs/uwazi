import { QueueSegmentationsOnFeatureEnabled } from '../listeners/QueueSegmentationsOnFeatureEnabled.js';
import { QueueIdleSegmentationsFactory } from './QueueIdleSegmentationsFactory.js';

class QueueSegmentationsOnFeatureEnabledFactory {
  static default(): QueueSegmentationsOnFeatureEnabled {
    return new QueueSegmentationsOnFeatureEnabled({
      queueIdleSegmentations: QueueIdleSegmentationsFactory.default(),
    });
  }
}

export { QueueSegmentationsOnFeatureEnabledFactory };
