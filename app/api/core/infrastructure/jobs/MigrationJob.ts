import { Db } from 'mongodb';
import { tenants } from '#api/tenants/index.js';
import { DB } from '#api/odm/index.js';
import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
  Params,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { getPendingMigrations } from '#api/migrations/migrator.js';

type MigratorLike = {
  migrationsDir: string;
  loader: (p: string) => Promise<any>;
  migrateNext: (db: Db, schemaVersion?: number) => Promise<any>;
  migrateDelta: (db: Db, delta: number, schemaVersion?: number) => Promise<any>;
};

type MigrationJobResults = {
  appliedDataDeltas: number[];
  appliedSchemaDeltas: number[];
};

type MigrationJobParams = {
  reindex?: boolean;
  results?: MigrationJobResults;
};

type MigrationJobDeps = {
  migrator: MigratorLike;
  pgMigrator: PgMigrator;
  logger: Logger;
  dispatcher: JobsDispatcher;
  reindexTenant: () => Promise<void>;
};

class MigrationJob implements Dispatchable {
  constructor(private deps: MigrationJobDeps) {}

  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    params: Params,
    jobInfo?: JobInfo
  ): Promise<void> {
    const jobParams = this.normalizeParams(params as MigrationJobParams);
    const namespace = jobInfo?.namespace || 'system';

    this.deps.logger.info('Starting migration job', { namespace });

    const schemaVersion = await this.deps.pgMigrator.getCurrentVersion();
    this.deps.logger.info(`Current schema version: ${schemaVersion}`, { namespace });

    const nextDelta = await this.getNextGlobalDelta(schemaVersion);

    if (nextDelta === null) {
      await this.finishMigrationProcess(jobParams, namespace);
      return;
    }

    this.deps.logger.info(`Next data migration to apply: delta ${nextDelta}`, {
      delta: nextDelta,
      namespace,
    });

    const blockedInfo = await this.getBlockedInfo(nextDelta, schemaVersion);
    if (blockedInfo) {
      this.deps.logger.warning(
        `Migration ${nextDelta} is blocked, requires schema version ${blockedInfo.requiresSchema}`,
        { delta: nextDelta, requiresSchema: blockedInfo.requiresSchema, namespace }
      );
      const appliedSchemas = await this.deps.pgMigrator.migrate(blockedInfo.requiresSchema);
      jobParams.results.appliedSchemaDeltas.push(...appliedSchemas);
      this.deps.logger.info(
        `Applied schema migrations up to version ${blockedInfo.requiresSchema}: [${appliedSchemas.join(', ')}]`,
        {
          targetSchema: blockedInfo.requiresSchema,
          applied: appliedSchemas,
          delta: nextDelta,
          namespace,
        }
      );
      this.deps.logger.info(`Migration ${nextDelta} unblocked, applying now`, {
        delta: nextDelta,
        namespace,
      });
    }

    const migration = await this.runDeltaOnAllTenants(nextDelta, schemaVersion, namespace);
    const nextReindex = jobParams.reindex || migration.reindex === true;

    if (!jobParams.results.appliedDataDeltas.includes(nextDelta)) {
      jobParams.results.appliedDataDeltas.push(nextDelta);
    }

    this.deps.logger.info(`Migration ${nextDelta} complete on all tenants`, {
      delta: nextDelta,
      reindex: nextReindex,
      namespace,
    });

    this.deps.logger.info('Dispatching next migration job', { namespace });
    await this.deps.dispatcher.dispatch(MigrationJob, {
      reindex: nextReindex,
      results: jobParams.results,
    });
  }

  private normalizeParams(params: MigrationJobParams): Required<MigrationJobParams> {
    return {
      reindex: params.reindex ?? false,
      results: params.results ?? { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    };
  }

  private async getNextGlobalDelta(schemaVersion: number): Promise<number | null> {
    const tenantNames = Object.keys(tenants.tenants);
    let minDelta: number | null = null;

    const updateMinDelta = (delta: number) => {
      if (minDelta === null || delta < minDelta) {
        minDelta = delta;
      }
    };

    for (const tenantName of tenantNames) {
      // eslint-disable-next-line no-await-in-loop
      await tenants.run(async () => {
        const { runnable, blocked } = await getPendingMigrations(
          this.deps.migrator.migrationsDir,
          this.deps.migrator.loader,
          schemaVersion
        );

        const firstPending = runnable[0] || (blocked ? { delta: blocked.delta } : null);
        if (firstPending) {
          updateMinDelta(firstPending.delta);
        }
      }, tenantName);
    }

    return minDelta;
  }

  private async getBlockedInfo(
    delta: number,
    schemaVersion: number
  ): Promise<{ delta: number; requiresSchema: number } | null> {
    const tenantNames = Object.keys(tenants.tenants);
    if (tenantNames.length === 0) return null;

    let blocked: { delta: number; requiresSchema: number } | null = null;

    await tenants.run(async () => {
      const { runnable, blocked: pendingBlocked } = await getPendingMigrations(
        this.deps.migrator.migrationsDir,
        this.deps.migrator.loader,
        schemaVersion
      );

      const isTargetBlocked =
        pendingBlocked &&
        pendingBlocked.delta === delta &&
        !runnable.some(migration => migration.delta === delta);

      if (isTargetBlocked) {
        blocked = pendingBlocked;
      }
    }, tenantNames[0]);

    return blocked;
  }

  private async runDeltaOnAllTenants(
    delta: number,
    schemaVersion: number,
    namespace: string
  ): Promise<any> {
    const tenantNames = Object.keys(tenants.tenants);
    let appliedMigration: any = null;

    const captureAppliedMigration = (migration: any) => {
      appliedMigration = migration;
    };

    for (const tenantName of tenantNames) {
      // eslint-disable-next-line no-await-in-loop
      await tenants.run(async () => {
        this.deps.logger.info(`Applying migration ${delta} on tenant '${tenantName}'`, {
          delta,
          tenant: tenantName,
          namespace,
        });

        const tenant = tenants.current();
        const { db } = DB.connectionForDB(tenant.dbName);
        const result = await this.deps.migrator.migrateDelta(db as Db, delta, schemaVersion);

        if (result.status === 'applied') {
          captureAppliedMigration(result.migration);
          this.deps.logger.info(
            `Migration ${delta} successfully applied on tenant '${tenantName}'`,
            {
              delta,
              tenant: tenantName,
              namespace,
            }
          );
        } else if (result.status === 'done') {
          this.deps.logger.info(
            `Migration ${delta} already applied on tenant '${tenantName}', skipping`,
            {
              delta,
              tenant: tenantName,
              namespace,
            }
          );
        } else if (result.status === 'blocked') {
          this.deps.logger.error(
            `Migration ${delta} blocked on tenant '${tenantName}' after schema advance`,
            {
              delta,
              tenant: tenantName,
              requiresSchema: result.blocked?.requiresSchema,
              namespace,
            }
          );
          throw new Error(
            `Migration ${delta} is blocked on tenant ${tenantName} requiring schema ${result.blocked?.requiresSchema}`
          );
        }
      }, tenantName);
    }

    return appliedMigration || { reindex: false };
  }

  private async finishMigrationProcess(
    jobParams: Required<MigrationJobParams>,
    namespace: string
  ): Promise<void> {
    this.deps.logger.info('No pending data migrations, running remaining schema migrations', {
      namespace,
    });

    const appliedSchemas = await this.deps.pgMigrator.migrate();
    jobParams.results.appliedSchemaDeltas.push(...appliedSchemas);

    this.deps.logger.info(
      `Schema migrations complete: applied [${appliedSchemas.join(', ') || 'none'}]`,
      {
        applied: appliedSchemas,
        namespace,
      }
    );

    if (jobParams.reindex) {
      this.deps.logger.info('Reindex requested, reindexing all tenants', { namespace });
      await this.reindexAllTenants(namespace);
    }

    this.deps.logger.info('Migration process complete', {
      appliedDataDeltas: jobParams.results.appliedDataDeltas,
      appliedSchemaDeltas: jobParams.results.appliedSchemaDeltas,
      reindex: jobParams.reindex,
      namespace,
    });
  }

  private async reindexAllTenants(namespace: string): Promise<void> {
    const tenantNames = Object.keys(tenants.tenants);

    for (const tenantName of tenantNames) {
      // eslint-disable-next-line no-await-in-loop
      await tenants.run(async () => {
        this.deps.logger.info(`Reindexing tenant '${tenantName}'`, {
          tenant: tenantName,
          namespace,
        });
        await this.deps.reindexTenant();
        this.deps.logger.info(`Tenant '${tenantName}' reindexed`, {
          tenant: tenantName,
          namespace,
        });
      }, tenantName);
    }
  }
}

export { MigrationJob };
export type { MigrationJobDeps, MigrationJobParams, MigrationJobResults, MigratorLike };
