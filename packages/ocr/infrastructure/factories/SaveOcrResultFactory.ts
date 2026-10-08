import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { RelationshipsV1DataSourceFactory } from '#api/core/infrastructure/factories/RelationshipsV1DataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import type { RelationshipsV1DataSource } from '#shared/contracts/RelationshipsV1DataSource.js';
import { OcrEngine } from '../../application/contracts/OcrEngine.js';
import { SaveOcrResult } from '../../application/SaveOcrResult.js';
// eslint-disable-next-line import/no-cycle
import { OcrJobsAdapter } from '../jobs/OcrJobsAdapter.js';
import { OcrEngineFactory } from './OcrEngineFactory.js';
import { OcrRecordDataSourceFactory } from './OcrRecordDataSourceFactory.js';

type Overrides = {
  ocrEngine?: OcrEngine;
  relationshipsV1DS?: RelationshipsV1DataSource;
};

class SaveOcrResultFactory {
  static default(overrides: Overrides = {}): SaveOcrResult {
    const relationshipsV1DS =
      overrides.relationshipsV1DS ?? RelationshipsV1DataSourceFactory.default();

    return new SaveOcrResult({
      ocrDS: OcrRecordDataSourceFactory.default(),
      ocrEngine: OcrEngineFactory.default(),
      filesDS: FilesDataSourceFactory.default(),
      filesService: FilesServiceFactory.default({ relV1DS: relationshipsV1DS }),
      fileStorage: FileStorageFactory.default(),
      idGenerator: IdGeneratorFactory.default(),
      jobs: new OcrJobsAdapter({ jobsDispatcher: ExecutionContext.jobsDispatcher }),
      transactionManager: ExecutionContext.transactionManager,
      ...overrides,
      relationshipsV1DS,
    });
  }
}

export { SaveOcrResultFactory };
