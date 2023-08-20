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

function log(level: 'info' | 'error', message: string | object) {
  process.stdout.write(
    `${JSON.stringify({
      time: new Date().toISOString(),
      level,
      pid: process.pid,
      ...(typeof message === 'string' ? { message } : message),
    })}\n`
  );
}

log('info', 'Starting worker');
DB.connect(config.DBHOST, dbAuth)
  .then(async () => {
    log('info', 'Connected to MongoDB');
    const redisClient = await ApplicationRedisClient.getInstance();
    log('info', 'Connected to Redis');
    const RSMQ = new RedisSMQ({ client: redisClient });
    const queue = new RedisQueue(config.queueName, RSMQ);
    const queueWorker = new QueueWorker(queue, log);

    registerJobs(register.bind(queueWorker));
    log('info', { message: 'Registered jobs', jobs: queueWorker.getRegisteredJobs() });

    process.on('SIGINT', async () => {
      log('info', 'SIGINT received. Stopping worker');
      await queueWorker.stop();
    });

    process.on('SIGTERM', async () => {
      log('info', 'SIGTERM received. Stopping worker');
      await queueWorker.stop();
    });

    log('info', 'Queue worker started');
    await queueWorker.start();
    log('info', 'Queue worker stopped');

    await ApplicationRedisClient.close();
    log('info', 'Disconnected from Redis');

    await DB.disconnect();
    log('info', 'Disconected from MongoDB');
  })
  .catch(e => log('error', e));
