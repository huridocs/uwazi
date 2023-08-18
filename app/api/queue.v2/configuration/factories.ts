import RedisSMQ from 'rsmq';
import { ApplicationRedisClient } from '../infrastructure/ApplicationRedisClient';
import { JobsRouter } from '../infrastructure/JobsRouter';
import { RedisQueue } from '../infrastructure/RedisQueue';

export async function DefaultDispatcher(namespace: string) {
  const redisClient = await ApplicationRedisClient.getInstance();
  const RSMQ = new RedisSMQ({ client: redisClient });
  return new JobsRouter(
    queueName =>
      new RedisQueue(queueName, RSMQ, {
        namespace,
      })
  );
}
