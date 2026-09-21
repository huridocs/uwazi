import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import {
  getClient,
  getConnection,
  getSharedClient,
  getSharedConnection,
} from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { JobsDispatcher } from '../application/contracts/JobsDispatcher.js';
import { JobsRouter } from '../infrastructure/JobsRouter.js';
import { MongoQueueAdapter } from '../infrastructure/MongoQueueAdapter.js';
import { NamespacedDispatcher } from '../infrastructure/NamespacedDispatcher.js';
import { PostgresQueueAdapter } from '../infrastructure/PostgresQueueAdapter.js';
import { RoundRobinMongoQueueAdapter } from '../infrastructure/RoundRobinQueueAdapter.js';
import { RoundRobinPostgresQueueAdapter } from '../infrastructure/RoundRobinPostgresQueueAdapter.js';
import { QueueAdapter } from '../infrastructure/QueueAdapter.js';

export function DefaultQueueAdapter(transactionManager: TransactionManager) {
  return new MongoQueueAdapter(getSharedConnection(), transactionManager);
}

export function DefaultPostgresQueueAdapter(transactionManager?: PostgresTransactionManager) {
  return new PostgresQueueAdapter({
    workerKnex: PostgresDB.knex,
    transactionManager,
    logger: LoggerFactory.systemLogger(),
  });
}

export function PostgresRoundRobinQueueAdapter() {
  return new RoundRobinPostgresQueueAdapter({
    workerKnex: PostgresDB.knex,
    logger: LoggerFactory.systemLogger(),
  });
}

export function RoundRobinQueueAdapter() {
  return new RoundRobinMongoQueueAdapter(
    getSharedConnection(),
    new MongoTransactionManager(getSharedClient(), LoggerFactory.systemLogger())
  );
}

export function DefaultTestingQueueAdapter(transactionManager?: TransactionManager) {
  return new MongoQueueAdapter(
    getConnection(),
    transactionManager ?? new MongoTransactionManager(getClient(), LoggerFactory.default())
  );
}

export function TestingRoundRobinQueueAdapter() {
  return new RoundRobinMongoQueueAdapter(
    getConnection(),
    new MongoTransactionManager(getClient(), LoggerFactory.default())
  );
}

export function DefaultDispatcher(
  tenant: string,
  transactionManager: TransactionManager,
  queueAdapter?: QueueAdapter
): JobsDispatcher {
  return new JobsRouter(
    queueName =>
      new NamespacedDispatcher(
        tenant,
        queueName,
        queueAdapter || DefaultQueueAdapter(transactionManager)
      )
  );
}

export function NoOpDispatcher(): JobsDispatcher {
  return {
    async dispatch() {},
    async dispatchMany(callback: Parameters<JobsDispatcher['dispatchMany']>[0]) {
      await callback(async () => {});
    },
    async deleteByParams() {},
    async cancelByParams() {},
    async countByName() {
      return 0;
    },
  };
}
