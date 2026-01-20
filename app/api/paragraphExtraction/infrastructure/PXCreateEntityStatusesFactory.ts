import { Db } from 'mongodb';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { PXCreateEntityStatuses } from '#api/paragraphExtraction/application/PXCreateEntityStatuses.js';
import { PXEntityStatusesQueryServiceFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusesQueryServiceFactory.js';
import { PXEntitiesStatusDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory.js';
import { PXExtractorsQueryServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory.js';

type Props = {
  batchSize: number;
  connection?: Db;
  transactionManager?: MongoTransactionManager;
};

class PXCreateEntityStatusesFactory {
  static createDefault(props: Props) {
    const connection = props.connection || getConnection();
    const transactionManager = props.transactionManager || TransactionManagerFactory.default();

    const settingsDS = SettingsDataSourceFactory.default(transactionManager);

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
