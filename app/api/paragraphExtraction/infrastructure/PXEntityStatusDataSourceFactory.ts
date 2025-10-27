import { Db } from 'mongodb';

import { MongoSettingsDataSourceFactory } from 'api/core/infrastructure/factories/MongoSettingsDataSource';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';

import { MongoPXEntitiesStatusDataSource } from './MongoPXEntitiesStatusDataSource';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory';

type Props = {
  connection: Db;
  mongoTransactionManager: MongoTransactionManager;
};

export class PXEntitiesStatusDataSourceFactory {
  static createDefault(props: Props): MongoPXEntitiesStatusDataSource {
    const settingsDS = MongoSettingsDataSourceFactory.default(props.mongoTransactionManager);
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
