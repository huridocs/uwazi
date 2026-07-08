import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { config } from '#api/config.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import {
  JobRegistry,
  SyncJobsDispatcher,
} from '#api/core/libs/queue/infrastructure/SyncJobsDispatcher.js';
import { MigrationJobFactory } from '#api/core/infrastructure/factories/MigrationJobFactory.js';
import { MigrationJob } from '#api/core/infrastructure/jobs/MigrationJob.js';

const PG_MIGRATIONS_DIR = new URL(
  '../core/infrastructure/postgresql/schema_migrations',
  import.meta.url
).pathname;

type MigrationRunResult =
  | {
      done: true;
      appliedDataDeltas: number[];
      appliedSchemaDeltas: number[];
      schemaVersion: number;
    }
  | {
      dispatched: true;
    };

async function createDispatcher(options: { async: boolean }): Promise<JobsDispatcher> {
  if (options.async) {
    return DefaultDispatcher('system', TransactionManagerFactory.createForSharedDataBase());
  }

  const registry: JobRegistry = {};
  const dispatcher = new SyncJobsDispatcher(registry);
  registry.MigrationJob = async () => MigrationJobFactory.create({ dispatcher });

  return dispatcher;
}

async function runNewMigration(
  options: { async: boolean; structuredLogs: boolean } = {
    async: false,
    structuredLogs: false,
  }
): Promise<MigrationRunResult> {
  await DB.connect(config.DBHOST, config.DBAUTH);
  PostgresDB.connect();

  await tenants.setupTenants();

  const dispatcher = await createDispatcher(options);
  const initialResults = { appliedDataDeltas: [], appliedSchemaDeltas: [] };
  const logger = options.async
    ? LoggerFactory.systemLogger()
    : LoggerFactory.migrationLogger(options.structuredLogs);

  await tenants.run(async () => {
    await ExecutionContext.run(
      {
        tenant: tenants.current(),
        factories: {
          transactionManager: TransactionManagerFactory.default,
          jobsDispatcher: () => dispatcher,
          eventEmitter: EventEmitterFactory.default,
          idGenerator: IdGeneratorFactory.default,
          logger: () => logger,
        },
      },
      async () => {
        await dispatcher.dispatch(MigrationJob, {
          reindex: false,
          results: initialResults,
        });
      }
    );
  });

  const pgPool = PostgresDB.pool();
  const pgMigrator = new PgMigrator(PG_MIGRATIONS_DIR, pgPool);
  const schemaVersion = await pgMigrator.getCurrentVersion();

  await DB.disconnect();
  await PostgresDB.disconnect();

  if (options.async) {
    return { dispatched: true };
  }

  return {
    done: true,
    appliedDataDeltas: initialResults.appliedDataDeltas,
    appliedSchemaDeltas: initialResults.appliedSchemaDeltas,
    schemaVersion,
  };
}

export { runNewMigration };
export type { MigrationRunResult };
