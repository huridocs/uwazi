import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import {
  getClient,
  getConnection,
  getSharedClient,
  getSharedConnection,
} from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { JobsRouter } from '#api/core/libs/queue/infrastructure/JobsRouter.js';
import { MongoQueueAdapter } from '#api/core/libs/queue/infrastructure/MongoQueueAdapter.js';
import { NamespacedDispatcher, QueueOptions } from '#api/core/libs/queue/infrastructure/NamespacedDispatcher.js';
import { RoundRobinMongoQueueAdapter } from '#api/core/libs/queue/infrastructure/RoundRobinQueueAdapter.js';

export function DefaultQueueAdapter(transactionManager: TransactionManager) {
  return new MongoQueueAdapter(
    getSharedConnection(),
    transactionManager as MongoTransactionManager
  );
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
    (transactionManager as MongoTransactionManager) ??
    new MongoTransactionManager(getClient(), LoggerFactory.default())
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
  queueOptions?: QueueOptions
) {
  return new JobsRouter(
    queueName =>
      new NamespacedDispatcher(
        tenant,
        queueName,
        DefaultQueueAdapter(transactionManager),
        queueOptions
      )
  );
}
