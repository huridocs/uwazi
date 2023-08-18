/* eslint-disable max-statements */
/* eslint-disable no-console */
import { config } from 'api/config';
import { DB } from 'api/odm';
import { ApplicationRedisClient } from 'api/queue.v2/infrastructure/ApplicationRedisClient';
import { QueueWorker } from 'api/queue.v2/infrastructure/QueueWorker';
import { RedisQueue } from 'api/queue.v2/infrastructure/RedisQueue';

import RedisSMQ from 'rsmq';
import { tenants } from 'api/tenants';
import { Dispatchable } from 'api/queue.v2/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { registerJobs } from './queueRegistry';

let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

function register<T extends Dispatchable>(
  this: QueueWorker,
  dispatchable: DispatchableClass<T>,
  factory: (namespace: string) => Promise<T>
) {
  this.register(
    dispatchable,
    async namespace =>
      new Promise((resolve, reject) => {
        tenants
          .run(async () => {
            resolve(await factory(namespace));
          }, namespace)
          .catch(reject);
      })
  );
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

    registerJobs(register.bind(queueWorker));

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
