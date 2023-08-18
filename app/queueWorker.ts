/* eslint-disable max-statements */
/* eslint-disable no-console */
import { config } from 'api/config';
import { DB } from 'api/odm';
import { ApplicationRedisClient } from 'api/queue.v2/infrastructure/ApplicationRedisClient';
import { QueueWorker } from 'api/queue.v2/infrastructure/QueueWorker';
import { RedisQueue } from 'api/queue.v2/infrastructure/RedisQueue';
import {
  registerUpdateRelationshipPropertiesJob,
  registerUpdateTemplateRelationshipPropertiesJob,
} from 'api/relationships.v2/infrastructure/registerUpdateRelationshipPropertiesJob';
import RedisSMQ from 'rsmq';

let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

console.info('[💾 MongoDB] Connecting');
DB.connect(config.DBHOST, dbAuth)
  .then(async () => {
    console.info('[💾 MongoDB] Connected');
    console.info('[📥 Redis] Connecting');
    const redisClient = await ApplicationRedisClient.getInstance();
    console.info('[📥 Redis] Connected');
    const RSMQ = new RedisSMQ({ client: redisClient });
    const queue = new RedisQueue(config.queueName, RSMQ);

    const queueWorker = new QueueWorker(queue);

    registerUpdateRelationshipPropertiesJob(queueWorker);
    registerUpdateTemplateRelationshipPropertiesJob(queueWorker);

    process.on('SIGINT', async () => {
      console.info('[⚙️ Queue worker] Stopping');
      await queueWorker.stop();
    });

    console.info('[⚙️ Queue worker] Started');
    await queueWorker.start();
    console.info('[⚙️ Queue worker] Stopped');

    console.info('[📥 Redis] Disconnecting');
    await ApplicationRedisClient.close();
    console.info('[📥 Redis] Disconnected');

    console.info('[💾 MongoDb] Disconnecting');
    await DB.disconnect();
    console.info('[💾 MongoDb] Disconnected');
  })
  .catch(console.error);
