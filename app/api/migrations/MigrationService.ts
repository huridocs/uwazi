/* eslint-disable max-statements */
import path from 'path';
import { fileURLToPath } from 'url';
import { Connection, ConnectOptions } from 'mongoose';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { config } from '#api/config.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { withFeature } from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { StandardJSONWriter } from '#api/core/libs/logger/infrastructure/writers/StandardJSONWriter.js';
import { MigrationHumanReadableWriter } from '#api/core/libs/logger/infrastructure/writers/MigrationHumanReadableWriter.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { TelemetryCollector } from '#api/core/libs/logger/TelemetryCollector.js';
import {
  JobRegistry,
  SyncJobsDispatcher,
} from '#api/core/libs/queue/infrastructure/SyncJobsDispatcher.js';
import { MigrationJobFactory } from '#api/core/infrastructure/factories/MigrationJobFactory.js';
import { MigrationJob } from '#api/core/infrastructure/jobs/MigrationJob.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PG_MIGRATIONS_DIR = path.join(
  __dirname,
  '../core/infrastructure/postgresql/schema_migrations'
);

type MigrationRunResult =
  | {
      done: true;
      appliedDataDeltas: number[];
      appliedSchemaDeltas: number[];
      schemaVersion: number;
    }
  | {
      dispatched: true;
    }
  | {
      skipped: true;
      reason: string;
    };

type DBConnector = {
  connect: (host: string, auth: ConnectOptions) => Promise<Connection>;
  disconnect: () => Promise<void>;
};

type TenantsManager = {
  setupTenants: () => Promise<void>;
  run: (fn: () => Promise<void>, tenantName?: string) => Promise<void>;
  current: () => any;
  tenants: { [name: string]: any };
};

type DispatcherFactory = (options: { async: boolean }) => Promise<JobsDispatcher>;

type LoggerFactoryFn = (options: { async: boolean; structuredLogs: boolean }) => Logger;

type MigrationServiceDeps = {
  db: DBConnector;
  postgresDB: typeof PostgresDB;
  tenants: TenantsManager;
  createDispatcher: DispatcherFactory;
  createLogger: LoggerFactoryFn;
  pgMigratorFactory: (pool: any) => PgMigrator;
  transactionManagerFactory: () => any;
  postgresTransactionManagerFactory: () => any;
  eventEmitterFactory: () => any;
  idGeneratorFactory: () => any;
};

const MIGRATION_LOCK_WINDOW_MS = 1000 * 60 * 60; // 1 hour

const createDefaultDispatcher: DispatcherFactory = async (options: { async: boolean }) => {
  if (options.async) {
    return DefaultDispatcher('system', TransactionManagerFactory.createForSharedDataBase(), {
      lockWindow: MIGRATION_LOCK_WINDOW_MS,
    });
  }

  const registry: JobRegistry = {};
  const dispatcher = new SyncJobsDispatcher(registry);
  registry.MigrationJob = async () => MigrationJobFactory.create({ dispatcher });

  return dispatcher;
};

const createDefaultLogger: LoggerFactoryFn = (options: {
  async: boolean;
  structuredLogs: boolean;
}) => {
  if (options.async) {
    return LoggerFactory.systemLogger(withFeature(StandardJSONWriter, 'migration'));
  }
  if (options.structuredLogs) {
    return LoggerFactory.migrationLogger(withFeature(StandardJSONWriter, 'migration'));
  }
  return LoggerFactory.migrationLogger(MigrationHumanReadableWriter);
};

const createDefaultPgMigrator = (pool: any) => new PgMigrator(PG_MIGRATIONS_DIR, pool);

const defaultDeps: MigrationServiceDeps = {
  db: DB,
  postgresDB: PostgresDB,
  tenants,
  createDispatcher: createDefaultDispatcher,
  createLogger: createDefaultLogger,
  pgMigratorFactory: createDefaultPgMigrator,
  transactionManagerFactory: TransactionManagerFactory.default,
  postgresTransactionManagerFactory: PostgresTransactionManagerFactory.default,
  eventEmitterFactory: EventEmitterFactory.default,
  idGeneratorFactory: IdGeneratorFactory.default,
};

class MigrationService {
  constructor(private deps: MigrationServiceDeps) {}

  async run(options: { async: boolean; structuredLogs: boolean }): Promise<MigrationRunResult> {
    await this.deps.db.connect(config.DBHOST, config.DBAUTH);

    await this.deps.tenants.setupTenants();

    const dispatcher = await this.deps.createDispatcher(options);
    const initialResults = { appliedDataDeltas: [], appliedSchemaDeltas: [] };
    const logger = this.deps.createLogger(options);

    if (options.async) {
      const existingJobs = await dispatcher.countByName(MigrationJob);
      if (existingJobs > 0) {
        logger.warning(
          `Skipping migration job dispatch: ${existingJobs} MigrationJob(s) already queued`
        );
        await this.deps.db.disconnect();
        await this.deps.postgresDB.disconnect();
        return { skipped: true, reason: 'MigrationJob already queued' };
      }
    }

    await ExecutionContext.run(
      {
        factories: {
          transactionManager: this.deps.transactionManagerFactory,
          postgresTransactionManager: this.deps.postgresTransactionManagerFactory,
          jobsDispatcher: () => dispatcher,
          eventEmitter: this.deps.eventEmitterFactory,
          idGenerator: this.deps.idGeneratorFactory,
          logger: () => logger,
          telemetryCollector: () => new TelemetryCollector('migration'),
        },
      },
      async () => {
        await dispatcher.dispatch(MigrationJob, {
          reindex: false,
          results: initialResults,
        });
      }
    );

    const pgMigrator = this.deps.pgMigratorFactory(this.deps.postgresDB.adminPool());
    const schemaVersion = await pgMigrator.getCurrentVersion();

    await this.deps.db.disconnect();
    await this.deps.postgresDB.disconnect();

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
}

async function runNewMigration(
  options: { async: boolean; structuredLogs: boolean } = {
    async: false,
    structuredLogs: false,
  }
): Promise<MigrationRunResult> {
  const service = new MigrationService(defaultDeps);
  return service.run(options);
}

export { MigrationService, runNewMigration };
export type { MigrationRunResult, MigrationServiceDeps };
