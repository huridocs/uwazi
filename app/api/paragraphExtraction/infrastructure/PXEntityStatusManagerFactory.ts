import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import entitiesDS from 'api/entities';

import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXEntityStatusManager } from '../application/PXEntityStatusManager';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

export class PXEntityStatusManagerFactory {
  static createDefault() {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);

    return new PXEntityStatusManager({
      entitiesStatusDS,
      extractorsDS,
      settingsDS,
      entitiesDS,
    });
  }
}
