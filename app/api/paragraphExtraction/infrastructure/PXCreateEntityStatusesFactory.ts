import { Db } from 'mongodb';
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
import { DefaultTransactionManager } from '../common.v2/database/data_source_defaults.js';
import { getConnection } from '../common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../common.v2/database/MongoTransactionManager.js';
import { PXCreateEntityStatuses } from '../application/PXCreateEntityStatuses';
import { PXEntityStatusesQueryServiceFactory } from './PXEntityStatusesQueryServiceFactory';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory';

type Props = {
  batchSize: number;
  connection?: Db;
  transactionManager?: MongoTransactionManager;
};

class PXCreateEntityStatusesFactory {
  static createDefault(props: Props) {
    const connection = props.connection || getConnection();
    const transactionManager = props.transactionManager || DefaultTransactionManager();

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
      props.batchSize
    );
  }
}

export { PXCreateEntityStatusesFactory };
