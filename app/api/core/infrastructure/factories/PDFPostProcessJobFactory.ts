import { PDFPostProcessJob } from '#api/core/application/PDFPostProcessJob.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { PDFService } from '../services/PDFService.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

class PDFPostProcessJobFactory {
  static default(
    transactionManager: TransactionManager,
    deps: Partial<ConstructorParameters<typeof PDFPostProcessJob>[0]> = {}
  ) {
    return new PDFPostProcessJob({
      transactionManager,
      filesDS: FilesDataSourceFactory.default(),
      filesService: FilesServiceFactory.default(),
      eventBus: applicationEventsBus,
      fileStorage: FileStorageFactory.default(),
      pdfService: new PDFService(),
      idGenerator: IdGeneratorFactory.default(),
      entitiesDS: EntitiesDataSourceFactory.default(transactionManager),
      settingsDS: SettingsDataSourceFactory.default(transactionManager),
      ...deps,
    });
  }
}

export { PDFPostProcessJobFactory };
