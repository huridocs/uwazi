import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { OcrEngine } from '../../application/contracts/OcrEngine.js';
import { RequestOcr } from '../../application/RequestOcr.js';
// eslint-disable-next-line import/no-cycle
import { OcrJobsAdapter } from '../jobs/OcrJobsAdapter.js';
import { OcrEngineFactory } from './OcrEngineFactory.js';
import { OcrRecordDataSourceFactory } from './OcrRecordDataSourceFactory.js';

type Overrides = {
  ocrEngine?: OcrEngine;
  now?: () => number;
};

class RequestOcrFactory {
  static default(overrides: Overrides = {}): RequestOcr {
    return new RequestOcr({
      ocrDS: OcrRecordDataSourceFactory.default(),
      filesDS: FilesDataSourceFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
      ocrEngine: overrides.ocrEngine ?? OcrEngineFactory.default(),
      jobs: new OcrJobsAdapter({ jobsDispatcher: ExecutionContext.jobsDispatcher }),
      idGenerator: IdGeneratorFactory.default(),
      now: overrides.now ?? Date.now,
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { RequestOcrFactory };
