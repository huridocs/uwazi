/* eslint-disable max-statements */
import * as Sentry from '@sentry/node';
import { config } from 'api/config';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { LogEntry } from 'api/core/libs/logger/infrastructure/LogEntry';
import { LogWriter } from 'api/core/libs/logger/infrastructure/LogWriter';
import { withFeature } from 'api/core/libs/logger/infrastructure/StandardLogger';
import { StandardJSONWriter } from 'api/core/libs/logger/infrastructure/writers/StandardJSONWriter';
import { Dispatchable } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { RoundRobinQueueAdapter } from 'api/core/libs/queue/configuration/factories';
import {
  QueueWorker,
  QueueWorkerErrorHandler,
} from 'api/core/libs/queue/infrastructure/QueueWorker';
import { registerEventListeners } from 'api/eventListeners';
import { Redis } from 'api/infrastructure/Redis';
import { DB } from 'api/odm';
import { setupWorkerSockets } from 'api/socketio/setupSockets';
import { tenants } from 'api/tenants';
import { prettifyError } from 'api/utils/handleError';
import { initSentry } from './initSentry';
import { registerJobs } from './queueRegistry';
import { inspect } from 'util';

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

const logger = LoggerFactory.systemLogger(
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
  logger[prettyError.logLevel](inspect(error), { job: context?.job });
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
