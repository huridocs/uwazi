import { Db } from 'mongodb';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { PXCreateEntityStatuses } from '../application/PXCreateEntityStatuses.js';
import { PXEntityStatusesQueryServiceFactory } from './PXEntityStatusesQueryServiceFactory.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory.js';

type Props = {
  batchSize: number;
  connection?: Db;
  transactionManager?: TransactionManager;
};

class PXCreateEntityStatusesFactory {
  static createDefault(props: Props) {
    const connection = props.connection || getConnection();
    const transactionManager = props.transactionManager || ExecutionContext.mongoTransactionManager;

    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

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
