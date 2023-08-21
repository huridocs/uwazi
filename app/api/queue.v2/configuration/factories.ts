import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import {
  getSharedClient,
  getSharedConnection,
} from 'api/common.v2/database/getConnectionForCurrentTenant';
import { JobsRouter } from '../infrastructure/JobsRouter';
import { Queue } from '../infrastructure/Queue';
import { MongoQueueAdapter } from '../infrastructure/MongoQueueAdapter';

export async function DefaultDispatcher(namespace: string) {
  const mongoAdapter = new MongoQueueAdapter(
    getSharedConnection(),
    new MongoTransactionManager(getSharedClient())
  );
  return new JobsRouter(
    queueName =>
      new Queue(queueName, mongoAdapter, {
        namespace,
      })
  );
}
