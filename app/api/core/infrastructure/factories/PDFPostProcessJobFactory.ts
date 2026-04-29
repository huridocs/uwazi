import { PDFPostProcessJob } from '#api/core/application/PDFPostProcessJob.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { PDFService } from '../services/PDFService.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

class PDFPostProcessJobFactory {
  static default(overrides: Partial<ConstructorParameters<typeof PDFPostProcessJob>[0]> = {}) {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    return new PDFPostProcessJob({
      transactionManager,
      filesDS: FilesDataSourceFactory.default(),
      filesService: FilesServiceFactory.default(),
      eventBus: applicationEventsBus,
      fileStorage: FileStorageFactory.default(),
      pdfService: new PDFService(),
      idGenerator: IdGeneratorFactory.default(),
      entitiesDS: EntitiesDataSourceFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
      ...overrides,
    });
  }
}

export { PDFPostProcessJobFactory };
