import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';

import { Db } from 'mongodb';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory';

type Props = {
  connection?: Db;
  mongoTransactionManager?: MongoTransactionManager;
};

export class PXExtractorsDataSourceFactory {
  static createDefault(props: Props) {
    const connection = props.connection ?? getConnection();
    const mongoTransactionManager = props.mongoTransactionManager ?? DefaultTransactionManager();

    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    return new MongoPXExtractorsDataSource(
      connection,
      mongoTransactionManager,
      extractorsQueryService
    );
  }
}
