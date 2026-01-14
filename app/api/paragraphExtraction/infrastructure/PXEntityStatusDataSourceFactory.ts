import { Db } from 'mongodb';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { MongoTransactionManager } from '#api/common.v2/database/MongoTransactionManager.js';

import { MongoPXEntitiesStatusDataSource } from './MongoPXEntitiesStatusDataSource';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory';

type Props = {
  connection: Db;
  mongoTransactionManager: MongoTransactionManager;
};

export class PXEntitiesStatusDataSourceFactory {
  static createDefault(props: Props): MongoPXEntitiesStatusDataSource {
    const settingsDS = SettingsDataSourceFactory.default(props.mongoTransactionManager);
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
