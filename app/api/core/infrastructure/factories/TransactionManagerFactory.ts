import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { dbSessionContext } from 'api/odm/sessionsContext';
import { FakeMongoTransactionManager } from '../mongodb/common/FakeTransactionManager';
import { getClient, getSharedClient } from '../mongodb/common/getConnectionForCurrentTenant';
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

  static createForSharedDataBase() {
    const client = getSharedClient();
    const logger = LoggerFactory.systemLogger();

    return new MongoTransactionManager(client, logger);
  }

  static fake() {
    const client = getClient();
    const logger = LoggerFactory.default();
    return new FakeMongoTransactionManager(client, logger);
  }
}
