import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PostgresTransactionManager } from '../postgresql/common/PostgresTransactionManager.js';
import { LoggerFactory } from './LoggerFactory.js';

export class PostgresTransactionManagerFactory {
  static default(): PostgresTransactionManager {
    const tenant = ExecutionContext.currentTenant;
    const logger = LoggerFactory.default();
    return new PostgresTransactionManager(PostgresDB.knex, tenant.name, logger);
  }

  static forTesting() {
    return TestUtils.mockClass<TransactionManager>({
      run: jest.fn().mockImplementation(async (callback: () => Promise<unknown>) => callback()),
      onCommitted: jest.fn().mockReturnThis(),
      onRetry: jest.fn().mockReturnThis(),
      runHandlingOnCommitted: jest.fn().mockReturnValue({
        onCommitted: jest.fn().mockReturnThis(),
      }),
      isRunning: jest.fn().mockReturnValue(false),
    });
  }
}
