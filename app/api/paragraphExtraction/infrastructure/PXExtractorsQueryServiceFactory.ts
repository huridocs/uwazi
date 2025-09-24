import { Db } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';

import { MongoPXExtractorsQueryService } from './MongoPXExtractorsQueryService';

type Props = {
  connection?: Db;
  transactionManager?: MongoTransactionManager;
};

export class PXExtractorsQueryServiceFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager = props?.transactionManager || DefaultTransactionManager();

    // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
    return new MongoPXExtractorsQueryService(db, transactionManager);
  }
}
