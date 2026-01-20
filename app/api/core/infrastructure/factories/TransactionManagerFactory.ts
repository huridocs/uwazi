import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { dbSessionContext } from '#api/odm/sessionsContext.js';
import { FakeMongoTransactionManager } from '#api/core/infrastructure/mongodb/common/FakeTransactionManager.js';
import { getClient, getSharedClient } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

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
