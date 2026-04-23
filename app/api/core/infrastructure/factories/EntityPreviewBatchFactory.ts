import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { EntityPreviewBatchHandler } from '#api/core/infrastructure/jobs/EntityPreviewBatchHandler.js';

class EntityPreviewBatchHandlerFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    return new EntityPreviewBatchHandler({
      transactionManager,
      filesDS: FilesDataSourceFactory.default(transactionManager),
      entitiesDS: EntitiesDataSourceFactory.default(transactionManager),
      settingsDS: SettingsDataSourceFactory.default(transactionManager),
    });
  }
}

export { EntityPreviewBatchHandlerFactory };
