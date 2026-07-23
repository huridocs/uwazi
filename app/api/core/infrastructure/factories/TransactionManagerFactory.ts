import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { FakeMongoTransactionManager } from '../mongodb/common/FakeTransactionManager.js';
import { getClient, getSharedClient } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';

export class TransactionManagerFactory {
  static default() {
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
