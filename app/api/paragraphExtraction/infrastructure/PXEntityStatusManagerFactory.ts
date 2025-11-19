import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';

import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXEntityStatusManager } from '../application/PXEntityStatusManager';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

export class PXEntityStatusManagerFactory {
  static createDefault() {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const settingsDS = SettingsDataSourceFactory.default(mongoTransactionManager);

    const filesDS = FilesDataSourceFactory.default(mongoTransactionManager);
    const entitiesDS = DefaultEntitiesDataSource(mongoTransactionManager);

    return new PXEntityStatusManager({
      entitiesStatusDS,
      extractorsDS,
      settingsDS,
      entitiesDS,
      filesDS,
    });
  }
}
