import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import {
  getClient,
  getConnection,
  getSharedClient,
  getSharedConnection,
} from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { DefaultLogger, SystemLogger } from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { JobsRouter } from '../infrastructure/JobsRouter.js';
import { MongoQueueAdapter } from '../infrastructure/MongoQueueAdapter.js';
import { NamespacedDispatcher, QueueOptions } from '../infrastructure/NamespacedDispatcher.js';
import { RoundRobinMongoQueueAdapter } from '../infrastructure/RoundRobinQueueAdapter.js';

export function DefaultQueueAdapter() {
  return new MongoQueueAdapter(
    getSharedConnection(),
    new MongoTransactionManager(getSharedClient(), SystemLogger())
  );
}

export function RoundRobinQueueAdapter() {
  return new RoundRobinMongoQueueAdapter(
    getSharedConnection(),
    new MongoTransactionManager(getSharedClient(), SystemLogger())
  );
}

export function DefaultTestingQueueAdapter() {
  return new MongoQueueAdapter(
    getConnection(),
    new MongoTransactionManager(getClient(), DefaultLogger())
  );
}

export function TestingRoundRobinQueueAdapter() {
  return new RoundRobinMongoQueueAdapter(
    getConnection(),
    new MongoTransactionManager(getClient(), DefaultLogger())
  );
}

export async function DefaultDispatcher(tenant: string, queueOptions?: QueueOptions) {
  return new JobsRouter(
    queueName => new NamespacedDispatcher(tenant, queueName, DefaultQueueAdapter(), queueOptions)
  );
}
