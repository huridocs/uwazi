import {
  getSharedConnection,
  getSharedClient,
  getConnection,
  getClient,
} from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import {
  DefaultLogger,
  SystemLogger,
} from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { JobsRouter } from '#api/core/libs/queue/infrastructure/JobsRouter.js';
import { MongoQueueAdapter } from '#api/core/libs/queue/infrastructure/MongoQueueAdapter.js';
import { NamespacedDispatcher } from '#api/core/libs/queue/infrastructure/NamespacedDispatcher.js';
import { RoundRobinMongoQueueAdapter } from '#api/core/libs/queue/infrastructure/RoundRobinQueueAdapter.js';
import { QueueOptions } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';

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
