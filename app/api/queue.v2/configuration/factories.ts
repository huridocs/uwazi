import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import {
  getClient,
  getConnection,
  getSharedClient,
  getSharedConnection,
} from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultLogger, SystemLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { JobsRouter } from '../infrastructure/JobsRouter';
import { MongoQueueAdapter } from '../infrastructure/MongoQueueAdapter';
import { NamespacedDispatcher, QueueOptions } from '../infrastructure/NamespacedDispatcher';
import { RoundRobinMongoQueueAdapter } from '../infrastructure/RoundRobinQueueAdapter';

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
