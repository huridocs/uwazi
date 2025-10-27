import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { dbSessionContext } from 'api/odm/sessionsContext';
import { IdGenerator } from '../../application/contracts/IdGenerator';
import { getClient } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoIdHandler } from '../mongodb/common/MongoIdGenerator';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager';

const DefaultIdGenerator: IdGenerator = MongoIdHandler;

export class TransactionManagerFactory {
  static default() {
    const v1withTransactionStoredManager = dbSessionContext.getTransactionManager();
    if (v1withTransactionStoredManager) {
      return v1withTransactionStoredManager;
    }
    const client = getClient();
    const logger = DefaultLogger();
    return new MongoTransactionManager(client, logger);
  }
}

export { DefaultIdGenerator };
