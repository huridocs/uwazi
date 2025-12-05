import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import {
  getClient,
  getConnection,
  getSharedClient,
  getSharedConnection,
} from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { JobsRouter } from '../infrastructure/JobsRouter';
import { MongoQueueAdapter } from '../infrastructure/MongoQueueAdapter';
import { NamespacedDispatcher, QueueOptions } from '../infrastructure/NamespacedDispatcher';
import { RoundRobinMongoQueueAdapter } from '../infrastructure/RoundRobinQueueAdapter';

export function DefaultQueueAdapter(transactionManager: MongoTransactionManager) {
  return new MongoQueueAdapter(getSharedConnection(), transactionManager);
}

export function RoundRobinQueueAdapter() {
  return new RoundRobinMongoQueueAdapter(
    getSharedConnection(),
    new MongoTransactionManager(getSharedClient(), LoggerFactory.systemLogger())
  );
}

export function DefaultTestingQueueAdapter(transactionManager?: MongoTransactionManager) {
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
  transactionManager: MongoTransactionManager,
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

export function TestingDispatcher(tenant: string, transactionManager: TransactionManager) {
  return new JobsRouter(
    queueName =>
      new NamespacedDispatcher(
        tenant,
        queueName,
        DefaultTestingQueueAdapter(transactionManager as MongoTransactionManager)
      )
  );
}
