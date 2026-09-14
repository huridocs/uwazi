import { Db } from 'mongodb';

import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

import { MongoPXEntitiesStatusDataSource } from './MongoPXEntitiesStatusDataSource.js';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory.js';

type Props = {
  connection: Db;
  mongoTransactionManager: TransactionManager;
};

export class PXEntitiesStatusDataSourceFactory {
  static createDefault(props: Props): MongoPXEntitiesStatusDataSource {
    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager: props.mongoTransactionManager,
    });
    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection: props.connection,
      transactionManager: props.mongoTransactionManager,
    });

    return new MongoPXEntitiesStatusDataSource(
      props.connection,
      props.mongoTransactionManager,
      settingsDS,
      extractorsQueryService
    );
  }
}
