/* eslint-disable max-statements */
import * as Sentry from '@sentry/node';
import { config } from 'api/config';
import { registerEventListeners } from 'api/eventListeners';
import { applicationEventsBus } from 'api/eventsbus';
import { Redis } from 'api/infrastructure/Redis';
import { LogEntry } from 'api/log.v2/infrastructure/LogEntry';
import { LogWriter } from 'api/log.v2/infrastructure/LogWriter';
import { SystemLogger, withFeature } from 'api/log.v2/infrastructure/StandardLogger';
import { StandardJSONWriter } from 'api/log.v2/infrastructure/writers/StandardJSONWriter';
import { DB } from 'api/odm';
import { Dispatchable } from 'api/queue.v2/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { RoundRobinQueueAdapter } from 'api/queue.v2/configuration/factories';
import { QueueWorker, QueueWorkerErrorHandler } from 'api/queue.v2/infrastructure/QueueWorker';
import { setupWorkerSockets } from 'api/socketio/setupSockets';
import { tenants } from 'api/tenants';
import { prettifyError } from 'api/utils/handleError';
import { initSentry } from './initSentry';
import { registerJobs } from './queueRegistry';

type Props = {
  standAloneProcess?: boolean;
};

const replaceTenantWithJobNamespace =
  (writer: LogWriter): LogWriter =>
  (log: LogEntry) => {
    writer(
      new LogEntry(log.message, log.timestamp, log.level, log.tenant, {
        ...log.metadata,
        ...(log.metadata?.job?.namespace ? { tenant: log.metadata.job.namespace } : {}),
      })
    );
  };

const logger = SystemLogger(
  replaceTenantWithJobNamespace(withFeature(StandardJSONWriter, 'Queue worker'))
);

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
  const prettyError: { logLevel: 'debug' | 'error'; message: string } = prettifyError(error);
  logger[prettyError.logLevel](prettyError.message, { job: context?.job });
  if (prettyError.logLevel === 'error') {
    Sentry.withScope(scope => {
      if (context?.job) {
        scope.setExtra('job', context.job);
      }
      Sentry.captureException(error);
    });
  }
};

export function setupQueueWorker(props?: Props) {
  const standAloneProcess = props?.standAloneProcess ?? false;

  if (standAloneProcess) {
    initSentry();
  }

  logger.info('Starting worker');
  DB.connect(config.DBHOST, config.DBAUTH)
    .then(async () => {
      const redisClient = await Redis.connect();
      logger.info('Connected to Redis');
      if (standAloneProcess) {
        setupWorkerSockets(redisClient);
      }
      logger.info('Connected to MongoDB');
      const adapter = RoundRobinQueueAdapter();
      const queueWorker = new QueueWorker(config.queueName, adapter, logger, captureError);

      await tenants.setupTenants();
      logger.info('Set tenants up');

      registerJobs(register.bind(queueWorker));
      logger.info('Registered jobs', { jobs: queueWorker.getRegisteredJobs() });

      if (standAloneProcess) {
        registerEventListeners(applicationEventsBus);
        logger.info('Registered event listeners');
      }

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
      await Redis.disconnect();
      logger.info('Disconected from redis');
    })
    .catch(async e => {
      captureError(e);
      await Sentry.close(2000);
      process.exit(1);
    });
}
