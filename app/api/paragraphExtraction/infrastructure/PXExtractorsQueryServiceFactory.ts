import { Db } from 'mongodb';

import { getConnection } from '../common.v2/database/getConnectionForCurrentTenant.js';
import { DefaultTransactionManager } from '../common.v2/database/data_source_defaults.js';
import { MongoTransactionManager } from '../common.v2/database/MongoTransactionManager.js';

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
