import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { tenants } from '#api/tenants/tenantContext.js';

const runInJobContext = async (tenantName: string, fn: () => Promise<void>): Promise<void> => {
  await tenants.run(async () => {
    const tenant = tenants.current();
    await ExecutionContext.run(
      {
        tenant,
        factories: {
          transactionManager: TransactionManagerFactory.default,
          postgresTransactionManager: PostgresTransactionManagerFactory.default,
          jobsDispatcher: () => DefaultDispatcher(tenant.name, ExecutionContext.transactionManager),
          eventEmitter: () => EventEmitterFactory.default(),
          idGenerator: IdGeneratorFactory.default,
          logger: LoggerFactory.default,
        },
      },
      fn
    );
  }, tenantName);
};

export { runInJobContext };
