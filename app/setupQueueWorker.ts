/* eslint-disable max-statements */
import { inspect } from 'util';
import { getCurrentScope, captureException, close } from '@sentry/node-core/light';
import { config } from '#api/config.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { ElasticSearchClientFactory } from '#api/core/infrastructure/elasticSearch/ElasticSearchClientFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { LogEntry } from '#api/core/libs/logger/infrastructure/LogEntry.js';
import { LogWriter } from '#api/core/libs/logger/infrastructure/LogWriter.js';
import { withFeature } from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { StandardJSONWriter } from '#api/core/libs/logger/infrastructure/writers/StandardJSONWriter.js';
import {
  RoundRobinQueueAdapter,
  DefaultDispatcher,
} from '#api/core/libs/queue/configuration/factories.js';
import {
  QueueWorker,
  QueueWorkerErrorHandler,
} from '#api/core/libs/queue/infrastructure/QueueWorker.js';
import { registerEventListeners } from '#api/eventListeners.js';
import { Redis } from '#api/infrastructure/Redis.js';
import { DB } from '#api/odm/index.js';
import { setupWorkerSockets } from '#api/socketio/setupSockets.js';
import { tenants } from '#api/tenants/index.js';
import { prettifyError } from '#api/utils/handleError.js';
import { initSentry } from './initSentry.js';
import { registerJobs } from './queueRegistry.js';

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

const captureError: QueueWorkerErrorHandler = (error, context) => {
  const prettyError: { logLevel: 'debug' | 'error'; message: string } = prettifyError(error);
  logger[prettyError.logLevel](inspect(error), { job: context?.job });
  if (prettyError.logLevel === 'error') {
    const scope = getCurrentScope();
    if (context?.job) {
      scope.setExtra('job', context.job);
    }
    captureException(error);
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
      const queueWorker = new QueueWorker(config.queueName, adapter, logger, captureError, {
        contextRunner: async (namespace, fn) =>
          tenants.run(
            async () =>
              DependenciesContext.run(
                {
                  factories: {
                    transactionManager: TransactionManagerFactory.default,
                    jobsDispatcher: () =>
                      DefaultDispatcher(namespace, DependenciesContext.transactionManager),
                    eventEmitter: EventEmitterFactory.default,
                    idGenerator: IdGeneratorFactory.default,
                    logger: LoggerFactory.default,
                    elasticClient: () => ElasticSearchClientFactory.tenantAware(namespace),
                    authorizedEntityESClient: () =>
                      ElasticSearchClientFactory.authorizedEntityClient(namespace, null),
                  },
                },
                fn
              ),
            namespace
          ),
      });

      await tenants.setupTenants();
      logger.info('Set tenants up');

      registerJobs(queueWorker.register.bind(queueWorker));
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
      await close(2000);
      process.exit(1);
    });
}
