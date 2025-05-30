import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { PXCreateEntityStatuses } from '../application/PXCreateEntityStatuses';
import { PXEntityStatusesQueryServiceFactory } from './PXEntityStatusesQueryServiceFactory';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory';

class PXCreateEntityStatusesFactory {
  static createDefault(batchSize: number) {
    const connection = getConnection();
    const transactionManager = DefaultTransactionManager();

    const settingsDS = DefaultSettingsDataSource(transactionManager);

    const pxEntityStatusesQueryService = PXEntityStatusesQueryServiceFactory.createDefault({
      connection,
      transactionManager,
    });

    const pxEntitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager: transactionManager,
    });
    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection,
      transactionManager,
    });

    return new PXCreateEntityStatuses(
      {
        settingsDS,
        pxEntityStatusesQueryService,
        pxEntitiesStatusDS,
        extractorsQueryService,
      },
      batchSize
    );
  }
}

export { PXCreateEntityStatusesFactory };
