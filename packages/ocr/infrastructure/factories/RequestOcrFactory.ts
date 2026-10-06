import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { RequestOcr } from '../../application/RequestOcr.js';
// eslint-disable-next-line import/no-cycle
import { OcrJobsAdapter } from '../jobs/OcrJobsAdapter.js';
import {
  OcrAvailabilityOverrides,
  OcrAvailabilityServiceFactory,
} from './OcrAvailabilityServiceFactory.js';
import { OcrRecordDataSourceFactory } from './OcrRecordDataSourceFactory.js';

class RequestOcrFactory {
  static default(overrides: OcrAvailabilityOverrides = {}): RequestOcr {
    return new RequestOcr({
      ocrDS: OcrRecordDataSourceFactory.default(),
      ocrAvailability: OcrAvailabilityServiceFactory.default(overrides),
      jobs: new OcrJobsAdapter({ jobsDispatcher: ExecutionContext.jobsDispatcher }),
      idGenerator: IdGeneratorFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { RequestOcrFactory };
