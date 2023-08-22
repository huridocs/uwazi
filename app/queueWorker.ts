/* eslint-disable max-statements */
/* eslint-disable no-console */
import { config } from 'api/config';
import { DB } from 'api/odm';
import { QueueWorker } from 'api/queue.v2/infrastructure/QueueWorker';
import { Queue } from 'api/queue.v2/infrastructure/Queue';

import { tenants } from 'api/tenants';
import { Dispatchable } from 'api/queue.v2/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { DefaultQueueAdapter } from 'api/queue.v2/configuration/factories';
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
    const adapter = DefaultQueueAdapter();
    const queue = new Queue(config.queueName, adapter);
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

    await DB.disconnect();
    log('info', 'Disconected from MongoDB');

    process.exit(0);
  })
  .catch(e => log('error', e));
