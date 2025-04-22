import { Db } from 'mongodb';

import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';

import { MongoPXExtractorsQueryService } from './MongoPXExtractorsQueryService';

type Props = {
  connection?: Db;
  transactionManager?: MongoTransactionManager;
};

export class PXExtractorsQueryServiceFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager = props?.transactionManager || DefaultTransactionManager();

    return new MongoPXExtractorsQueryService(db, transactionManager);
  }
}
