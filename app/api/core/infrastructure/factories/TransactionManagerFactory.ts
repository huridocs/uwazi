import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { dbSessionContext } from 'api/odm/sessionsContext';
import { getClient } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager';

export class TransactionManagerFactory {
  static default() {
    const v1withTransactionStoredManager = dbSessionContext.getTransactionManager();
    if (v1withTransactionStoredManager) {
      return v1withTransactionStoredManager;
    }
    const client = getClient();
    const logger = LoggerFactory.default();
    return new MongoTransactionManager(client, logger);
  }
}
