import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import {
  getClient,
  getConnection,
  getSharedClient,
  getSharedConnection,
} from 'api/common.v2/database/getConnectionForCurrentTenant';
import { JobsRouter } from '../infrastructure/JobsRouter';
import { Queue } from '../infrastructure/Queue';
import { MongoQueueAdapter } from '../infrastructure/MongoQueueAdapter';

export function DefaultQueueAdapter() {
  return new MongoQueueAdapter(
    getSharedConnection(),
    new MongoTransactionManager(getSharedClient())
  );
}

export function DefaultTestingQueueAdapter() {
  return new MongoQueueAdapter(getConnection(), new MongoTransactionManager(getClient()));
}

export async function DefaultDispatcher(namespace: string) {
  return new JobsRouter(
    queueName =>
      new Queue(queueName, DefaultQueueAdapter(), {
        namespace,
      })
  );
}
