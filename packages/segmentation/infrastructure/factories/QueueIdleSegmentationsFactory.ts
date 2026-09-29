import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { QueueIdleSegmentations } from '../../application/QueueIdleSegmentations.js';
import { SegmentationDataSourceFactory } from './SegmentationDataSourceFactory.js';
import { SegmentationSchedulerFactory } from './SegmentationSchedulerFactory.js';

class QueueIdleSegmentationsFactory {
  static default(): QueueIdleSegmentations {
    return new QueueIdleSegmentations({
      segmentationDS: SegmentationDataSourceFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
      scheduler: SegmentationSchedulerFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { QueueIdleSegmentationsFactory };
