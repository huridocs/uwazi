/* eslint-disable max-statements */
import { randomUUID } from 'crypto';
import { Connection, ConnectOptions } from 'mongoose';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { config } from '#api/config.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { MigrationKind, PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { TenantMigrationRunner } from '#api/core/infrastructure/mongodb/TenantMigrationRunner.js';
import { TenantMigrationRunnerAdapter } from '#api/core/infrastructure/mongodb/TenantMigrationRunnerAdapter.js';
import { migrator } from './migrator.js';
import { ExecutionContextFactory } from '#api/core/infrastructure/factories/ExecutionContextFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { withFeature } from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { StandardJSONWriter } from '#api/core/libs/logger/infrastructure/writers/StandardJSONWriter.js';
import { MigrationHumanReadableWriter } from '#api/core/libs/logger/infrastructure/writers/MigrationHumanReadableWriter.js';
import { JobsDispatcherFactory } from '#api/core/infrastructure/factories/JobsDispatcherFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import {
  JobRegistry,
  SyncJobsDispatcher,
} from '#api/core/libs/queue/infrastructure/SyncJobsDispatcher.js';
import { MigrationJobFactory } from '#api/core/infrastructure/factories/MigrationJobFactory.js';
import { PgMigratorFactory } from '#api/core/infrastructure/factories/PgMigratorFactory.js';
import { MigrationJob } from '#api/core/infrastructure/jobs/MigrationJob.js';

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

type MigrationStatusReport = {
  postgres: {
    applied: number[];
    pending: Array<{ delta: number; name: string; kind: MigrationKind; outOfOrder: boolean }>;
  };
  /** Only tenants with something pending. */
  mongo: { pendingByTenant: Record<string, number[]> };
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

type LoggerFactoryFn = (options: {
  async: boolean;
  structuredLogs: boolean;
  correlationId?: string;
}) => Logger;

type MigrationServiceDeps = {
  db: DBConnector;
  postgresDB: typeof PostgresDB;
  tenants: TenantsManager;
  createDispatcher: DispatcherFactory;
  createLogger: LoggerFactoryFn;
  pgMigratorFactory: (pool: any, logger: Logger) => PgMigrator;
  tenantMigrationRunner: Pick<TenantMigrationRunner, 'getPendingMigrations'>;
  transactionManagerFactory: () => any;
  postgresTransactionManagerFactory: () => any;
  eventEmitterFactory: () => any;
  idGeneratorFactory: () => any;
};

const createDefaultDispatcher: DispatcherFactory = async (options: { async: boolean }) => {
  if (options.async) {
    return JobsDispatcherFactory.system();
  }

  const registry: JobRegistry = {};
  const dispatcher = new SyncJobsDispatcher(registry);
  registry.MigrationJob = async () => MigrationJobFactory.create({ dispatcher });

  return dispatcher;
};

const createDefaultLogger: LoggerFactoryFn = options => {
  if (options.async) {
    return LoggerFactory.systemLogger(
      withFeature(StandardJSONWriter, 'migration'),
      options.correlationId
    );
  }
  if (options.structuredLogs) {
    return LoggerFactory.migrationLogger(
      withFeature(StandardJSONWriter, 'migration'),
      options.correlationId
    );
  }
  return LoggerFactory.migrationLogger(MigrationHumanReadableWriter, options.correlationId);
};

const createDefaultPgMigrator = (pool: any, logger: Logger) =>
  PgMigratorFactory.create(logger, pool);

const defaultDeps: MigrationServiceDeps = {
  db: DB,
  postgresDB: PostgresDB,
  tenants,
  createDispatcher: createDefaultDispatcher,
  createLogger: createDefaultLogger,
  pgMigratorFactory: createDefaultPgMigrator,
  tenantMigrationRunner: new TenantMigrationRunnerAdapter(migrator.migrationsDir, migrator.loader),
  transactionManagerFactory: TransactionManagerFactory.mongo,
  postgresTransactionManagerFactory: PostgresTransactionManagerFactory.default,
  eventEmitterFactory: EventEmitterFactory.default,
  idGeneratorFactory: IdGeneratorFactory.default,
};

class MigrationService {
  constructor(private deps: MigrationServiceDeps) {}

  /** What is pending in both databases. Applies nothing. */
  async status(): Promise<MigrationStatusReport> {
    await this.deps.db.connect(config.DBHOST, config.DBAUTH);
    await this.deps.tenants.setupTenants();

    try {
      const logger = this.deps.createLogger({ async: false, structuredLogs: false });
      const pgMigrator = this.deps.pgMigratorFactory(this.deps.postgresDB.adminPool(), logger);
      const { applied, pending } = await pgMigrator.status();

      return {
        postgres: {
          applied: applied.map(({ delta }) => delta),
          pending: pending.map(({ delta, name, kind, outOfOrder }) => ({
            delta,
            name,
            kind,
            outOfOrder,
          })),
        },
        mongo: { pendingByTenant: await this.pendingMongoMigrations() },
      };
    } finally {
      await this.deps.db.disconnect();
      await this.deps.postgresDB.disconnect();
    }
  }

  private async pendingMongoMigrations(): Promise<Record<string, number[]>> {
    const pendingByTenant: Record<string, number[]> = {};
    for (const tenant of Object.values(this.deps.tenants.tenants)) {
      // eslint-disable-next-line no-await-in-loop
      const { runnable, blocked } = await this.deps.tenantMigrationRunner.getPendingMigrations(
        tenant,
        Number.MAX_SAFE_INTEGER
      );
      const deltas = [...runnable.map(({ delta }) => delta), ...(blocked ? [blocked.delta] : [])];
      if (deltas.length > 0) {
        pendingByTenant[tenant.name] = deltas;
      }
    }
    return pendingByTenant;
  }

  async run(options: { async: boolean; structuredLogs: boolean }): Promise<MigrationRunResult> {
    await this.deps.db.connect(config.DBHOST, config.DBAUTH);

    await this.deps.tenants.setupTenants();

    const dispatcher = await this.deps.createDispatcher(options);
    const initialResults = { appliedDataDeltas: [], appliedSchemaDeltas: [] };
    // One id for the whole run: every job of the migration chain carries it to its logs.
    const correlationId = randomUUID();
    const logger = this.deps.createLogger({ ...options, correlationId });

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

    await ExecutionContextFactory.run(
      {
        correlationId,
        telemetry: { kind: 'migration' },
        overrides: {
          transactionManager: this.deps.transactionManagerFactory,
          mongoTransactionManager: this.deps.transactionManagerFactory,
          postgresTransactionManager: this.deps.postgresTransactionManagerFactory,
          jobsDispatcher: () => dispatcher,
          eventEmitter: this.deps.eventEmitterFactory,
          idGenerator: this.deps.idGeneratorFactory,
          logger: () => logger,
        },
      },
      async () => {
        await dispatcher.dispatch(MigrationJob, {
          reindexTenants: [],
          results: initialResults,
          correlationId,
        });
      }
    );

    const pgMigrator = this.deps.pgMigratorFactory(this.deps.postgresDB.adminPool(), logger);
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

async function migrationStatus(): Promise<MigrationStatusReport> {
  return new MigrationService(defaultDeps).status();
}

export { MigrationService, runNewMigration, migrationStatus };
export type { MigrationRunResult, MigrationServiceDeps, MigrationStatusReport };
