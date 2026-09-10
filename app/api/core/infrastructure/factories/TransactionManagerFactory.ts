import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { FakeMongoTransactionManager } from '../mongodb/common/FakeTransactionManager.js';
import { getClient, getSharedClient } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { PostgresTransactionManager } from '../postgresql/common/PostgresTransactionManager.js';
import { PostgresTransactionManagerFactory } from './PostgresTransactionManagerFactory.js';

export class TransactionManagerFactory {
  static mongo(): MongoTransactionManager {
    const client = getClient();
    const logger = LoggerFactory.default();
    return new MongoTransactionManager(client, logger);
  }

  static postgres(): PostgresTransactionManager {
    return PostgresTransactionManagerFactory.default();
  }

  /**
   * The transaction manager for the current tenant's configuration: Postgres
   * when postgresCore is active, Mongo otherwise.
   */
  static default(): TransactionManager {
    return isPostgresCoreActive() ? this.postgres() : this.mongo();
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

  static forTesting() {
    return TestUtils.mockClass<TransactionManager>({
      run: jest.fn().mockResolvedValue(undefined),
      onCommitted: jest.fn().mockReturnThis(),
      onRetry: jest.fn().mockReturnThis(),
      runHandlingOnCommitted: jest.fn().mockReturnValue({
        onCommitted: jest.fn().mockReturnThis(),
      }),
      isRunning: jest.fn().mockReturnValue(false),
    });
  }
}
