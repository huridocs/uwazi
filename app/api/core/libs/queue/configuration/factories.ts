import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import {
  getClient,
  getConnection,
  getSharedClient,
  getSharedConnection,
} from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { JobsRouter } from '../infrastructure/JobsRouter';
import { MongoQueueAdapter } from '../infrastructure/MongoQueueAdapter';
import { NamespacedDispatcher, QueueOptions } from '../infrastructure/NamespacedDispatcher';
import { RoundRobinMongoQueueAdapter } from '../infrastructure/RoundRobinQueueAdapter';

export function DefaultQueueAdapter() {
  return new MongoQueueAdapter(
    getSharedConnection(),
    new MongoTransactionManager(getSharedClient(), LoggerFactory.systemLogger())
  );
}

export function RoundRobinQueueAdapter() {
  return new RoundRobinMongoQueueAdapter(
    getSharedConnection(),
    new MongoTransactionManager(getSharedClient(), LoggerFactory.systemLogger())
  );
}

export function DefaultTestingQueueAdapter() {
  return new MongoQueueAdapter(
    getConnection(),
    new MongoTransactionManager(getClient(), LoggerFactory.default())
  );
}

export function TestingRoundRobinQueueAdapter() {
  return new RoundRobinMongoQueueAdapter(
    getConnection(),
    new MongoTransactionManager(getClient(), LoggerFactory.default())
  );
}

export async function DefaultDispatcher(tenant: string, queueOptions?: QueueOptions) {
  return new JobsRouter(
    queueName => new NamespacedDispatcher(tenant, queueName, DefaultQueueAdapter(), queueOptions)
  );
}
