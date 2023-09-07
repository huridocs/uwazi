/* eslint-disable max-statements */
import { config } from 'api/config';
import { DB } from 'api/odm';
import { QueueWorker } from 'api/queue.v2/infrastructure/QueueWorker';
import { tenants } from 'api/tenants';
import { Dispatchable } from 'api/queue.v2/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { DefaultQueueAdapter } from 'api/queue.v2/configuration/factories';
import { inspect } from 'util';
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
    const queueWorker = new QueueWorker(config.queueName, adapter, log);

    await tenants.setupTenants();
    log('info', 'Set tenants up');

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
  .catch(e => log('error', inspect(e)));
