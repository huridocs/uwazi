import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { CachedTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoDatavizQueryExecutor } from '../mongodb/MongoDatavizQueryExecutor.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

class DatavizQueryExecutorFactory {
  static default() {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new MongoDatavizQueryExecutor(getConnection(), transactionManager, {
      settingsDS: SettingsDataSourceFactory.cached({ transactionManager }),
      translationsDS: CachedTranslationsDataSource(transactionManager),
    });
  }
}

export { DatavizQueryExecutorFactory };
