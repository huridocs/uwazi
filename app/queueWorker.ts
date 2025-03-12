import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from 'api/config';
import { SystemLogger, withFeature } from 'api/log.v2/infrastructure/StandardLogger';
import { DB } from 'api/odm';
import { Dispatchable } from 'api/queue.v2/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { DefaultQueueAdapter } from 'api/queue.v2/configuration/factories';
import { QueueWorkerErrorHandler, QueueWorker } from 'api/queue.v2/infrastructure/QueueWorker';
import { tenants } from 'api/tenants';
import { inspect } from 'util';
import { registerJobs } from './queueRegistry';
import { StandardJSONWriter } from 'api/log.v2/infrastructure/writers/StandardJSONWriter';

if (config.sentry.dsn) {
  Sentry.init({
    release: config.VERSION,
    dsn: config.sentry.dsn,
    environment: config.ENVIRONMENT,
    integrations: [
      Sentry.httpIntegration({ tracing: true }),
      new Tracing.Integrations.Mongo({ useMongoose: true }),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: config.sentry.tracesSampleRate,
  });
}

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

const captureError: QueueWorkerErrorHandler = (error, context) => {
  Sentry.withScope(scope => {
    if (context?.job) {
      scope.setExtra('job', context.job);
    }
    Sentry.captureException(error);
  });
};

const logger = SystemLogger(withFeature(StandardJSONWriter, 'Queue worker'));

logger.info('Starting worker');
DB.connect(config.DBHOST, dbAuth)
  .then(async () => {
    logger.info('Connected to MongoDB');
    const adapter = DefaultQueueAdapter();
    const queueWorker = new QueueWorker(config.queueName, adapter, logger, captureError);

    await tenants.setupTenants();
    logger.info('Set tenants up');

    registerJobs(register.bind(queueWorker));
    logger.info('Registered jobs', { jobs: queueWorker.getRegisteredJobs() });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received. Stopping worker');
      await queueWorker.stop();
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Stopping worker');
      await queueWorker.stop();
    });

    logger.info('Queue worker started');
    await queueWorker.start();
    logger.info('Queue worker stopped');

    await DB.disconnect();
    logger.info('Disconected from MongoDB');
  })
  .catch(async e => {
    logger.error(inspect(e));
    captureError(e);
    await Sentry.close(2000);
    process.exit(1);
  });
