/* eslint-disable max-statements */
/* eslint-disable no-console */
import { config } from 'api/config';
import { DB } from 'api/odm';
import { Queue } from 'api/queue.v2/application/Queue';
import { QueueWorker } from 'api/queue.v2/application/QueueWorker';
import { StringJobSerializer } from 'api/queue.v2/infrastructure/StringJobSerializer';
import { registerUpdateRelationshipPropertiesJob } from 'api/relationships.v2/infrastructure/registerUpdateRelationshipPropertiesJob';
import Redis from 'redis';
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
    const redisClient = Redis.createClient(`redis://${config.redis.host}:${config.redis.port}`);
    console.info('[📥 Redis] Connected');
    const RSMQ = new RedisSMQ({ client: redisClient });
    const queue = new Queue(config.queueName, RSMQ, StringJobSerializer);

    registerUpdateRelationshipPropertiesJob(queue);

    const queueWorker = new QueueWorker(queue);

    process.on('SIGINT', async () => {
      console.info('[⚙️ Queue worker] Stopping');
      await queueWorker.stop();
    });

    await new Promise<void>((resolve, reject) => {
      redisClient.on('ready', async () => {
        resolve();
      });

      redisClient.on('error', error => {
        reject(error);
      });
    });

    console.info('[⚙️ Queue worker] Started');
    await queueWorker.start();
    console.info('[⚙️ Queue worker] Stopped');

    console.info('[📥 Redis] Disconnecting');
    redisClient.quit(async () => {
      console.info('[📥 Redis] Disconnected');
      console.info('[💾 MongoDb] Disconnecting');
      await DB.disconnect();
      console.info('[💾 MongoDb] Disconnected');
    });
  })
  .catch(console.error);
