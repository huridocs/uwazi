import RedisSMQ from 'rsmq';
import { Queue } from '../application/Queue';
import { ApplicationRedisClient } from '../infrastructure/ApplicationRedisClient';
import { JobsRouter } from '../infrastructure/JobsRouter';
import { StringJobSerializer } from '../infrastructure/StringJobSerializer';

export async function DefaultDispatcher(namespace: string) {
  const redisClient = await ApplicationRedisClient.getInstance();
  const RSMQ = new RedisSMQ({ client: redisClient });
  return new JobsRouter(
    queueName =>
      new Queue(queueName, RSMQ, StringJobSerializer, {
        namespace,
      })
  );
}
