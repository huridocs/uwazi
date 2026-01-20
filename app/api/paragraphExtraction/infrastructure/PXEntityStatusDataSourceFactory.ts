import { Db } from 'mongodb';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

import { MongoPXEntitiesStatusDataSource } from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';
import { PXExtractorsQueryServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory.js';

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
