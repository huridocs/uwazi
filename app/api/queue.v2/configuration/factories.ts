import { MongoTransactionManager } from '../../common.v2/database/MongoTransactionManager.js';
import {
  getClient,
  getConnection,
  getSharedClient,
  getSharedConnection,
} from '../../common.v2/database/getConnectionForCurrentTenant.js';
import { DefaultLogger, SystemLogger } from '../../log.v2/infrastructure/StandardLogger.js';
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
