/* eslint-disable max-statements */
import { getCurrentScope, captureException, close } from '@sentry/node-core/light';
import { inspect } from 'util';
import { config } from '#api/config.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { LogEntry } from '#api/core/libs/logger/infrastructure/LogEntry.js';
import { LogWriter } from '#api/core/libs/logger/infrastructure/LogWriter.js';
import { withFeature } from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { StandardJSONWriter } from '#api/core/libs/logger/infrastructure/writers/StandardJSONWriter.js';
import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DispatchableClass } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import {
  DefaultDispatcher,
  RoundRobinQueueAdapter,
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
import { ElasticSearchClientFactory } from '#api/core/infrastructure/elasticSearch/ElasticSearchClientFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { ExecutionContext, ExecutionContextDeps } from '#api/core/libs/ExecutionContext.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { Job } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';
import { UserSchema } from '#shared/types/userType.js';
import users from '#api/users/users.js';
import { User } from '#api/users.v2/model/User.js';

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
  factory: (namespace: string, job: Job) => Promise<T>
) {
  this.register(dispatchable, async (namespace, job) => {
    let deps!: ExecutionContextDeps;
    let instance!: T;
    await tenants.run(async () => {
      let actor: UserSchema | null = null;
      if (job.params.userId) {
        actor = await users.getById(job.params.userId, '-password', true);
      }
      deps = {
        actor: User.createFrom(actor),
        tenant: tenants.current(),
        factories: {
          transactionManager: TransactionManagerFactory.default,
          jobsDispatcher: () => DefaultDispatcher(namespace, ExecutionContext.transactionManager),
          eventEmitter: EventEmitterFactory.default,
          idGenerator: IdGeneratorFactory.default,
          logger: LoggerFactory.default,
          elasticClient: () => ElasticSearchClientFactory.tenantAware(namespace),
          authorizedEntityESClient: () =>
            ElasticSearchClientFactory.authorizedEntityClient(namespace, User.createFrom(actor)),
        },
      };
      instance = await ExecutionContext.run(deps, async () => factory(namespace, job));
    }, namespace);

    // v1 backwards compatibility only (probably)
    ExecutionContext.attachContext(instance, 'handleDispatch', deps);

    return instance;
  });
}

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
      await close(2000);
      process.exit(1);
    });
}
