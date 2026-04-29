import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { EntityPreviewBatchHandler } from '#api/core/infrastructure/jobs/EntityPreviewBatchHandler.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class EntityPreviewBatchHandlerFactory {
  static default() {
    const transactionManager = ExecutionContext.transactionManager;
    return new EntityPreviewBatchHandler({
      transactionManager,
      filesDS: FilesDataSourceFactory.default(),
      entitiesDS: EntitiesDataSourceFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
    });
  }
}

export { EntityPreviewBatchHandlerFactory };
