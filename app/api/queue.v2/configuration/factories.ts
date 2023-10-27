import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import {
  getClient,
  getConnection,
  getSharedClient,
  getSharedConnection,
} from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { JobsRouter } from '../infrastructure/JobsRouter';
import { MongoQueueAdapter } from '../infrastructure/MongoQueueAdapter';
import { NamespacedDispatcher } from '../infrastructure/NamespacedDispatcher';

export function DefaultQueueAdapter() {
  return new MongoQueueAdapter(
    getSharedConnection(),
    new MongoTransactionManager(getSharedClient(), DefaultLogger())
  );
}

export function DefaultTestingQueueAdapter() {
  return new MongoQueueAdapter(
    getConnection(),
    new MongoTransactionManager(getClient(), DefaultLogger())
  );
}

export async function DefaultDispatcher(tenant: string) {
  return new JobsRouter(
    queueName => new NamespacedDispatcher(tenant, queueName, DefaultQueueAdapter())
  );
}
