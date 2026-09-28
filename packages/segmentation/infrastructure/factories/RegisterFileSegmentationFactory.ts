import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { RegisterFileSegmentation } from '../../application/RegisterFileSegmentation.js';
import { SegmentationDataSourceFactory } from './SegmentationDataSourceFactory.js';
import { SegmentationSchedulerFactory } from './SegmentationSchedulerFactory.js';

class RegisterFileSegmentationFactory {
  static default(): RegisterFileSegmentation {
    return new RegisterFileSegmentation({
      segmentationDS: SegmentationDataSourceFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
      scheduler: SegmentationSchedulerFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
      idGenerator: ExecutionContext.idGenerator,
    });
  }
}

export { RegisterFileSegmentationFactory };
