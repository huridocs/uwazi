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
    _jobInfo?: JobInfo
  ): Promise<void> {
    const jobParams = this.normalizeParams(params as MigrationJobParams);

    this.deps.logger.info('Starting migration job');

    let schemaVersion = await this.deps.pgMigrator.getCurrentVersion();
    this.deps.logger.info(`Current schema version: ${schemaVersion}`);

    const nextDelta = await this.getNextGlobalDelta(schemaVersion);

    if (nextDelta === null) {
      await this.finishMigrationProcess(jobParams);
      return;
    }

    this.deps.logger.info(`Next data migration to apply: delta ${nextDelta}`, {
      delta: nextDelta,
    });

    const blockedInfo = await this.getBlockedInfo(nextDelta, schemaVersion);
    if (blockedInfo) {
      this.deps.logger.warning(
        `Data migration ${nextDelta} blocked, requires schema version ${blockedInfo.requiresSchema}`,
        { delta: nextDelta, requiresSchema: blockedInfo.requiresSchema }
      );
      const appliedSchemas = await this.deps.pgMigrator.migrate(blockedInfo.requiresSchema);
      jobParams.results.appliedSchemaDeltas.push(...appliedSchemas);
      schemaVersion = await this.deps.pgMigrator.getCurrentVersion();
      this.deps.logger.info(`Applied schema migrations: [${appliedSchemas.join(', ')}]`, {
        targetSchema: blockedInfo.requiresSchema,
        applied: appliedSchemas,
        schemaVersion,
        delta: nextDelta,
      });
      this.deps.logger.info(`Data migration ${nextDelta} unblocked, applying now`, {
        delta: nextDelta,
        schemaVersion,
      });
    }

    const { migration, reindex: deltaReindex, applied } = await this.runDeltaOnAllTenants(
      nextDelta,
      schemaVersion
    );
    const nextReindex = jobParams.reindex || deltaReindex;

    if (applied && !jobParams.results.appliedDataDeltas.includes(nextDelta)) {
      jobParams.results.appliedDataDeltas.push(nextDelta);
    }

    if (applied) {
      this.deps.logger.info(`Applied data migration ${nextDelta}`, {
        delta: nextDelta,
        reindex: nextReindex,
      });
    } else {
      this.deps.logger.info(`Skipped data migration ${nextDelta} (already applied)`, {
        delta: nextDelta,
        reindex: nextReindex,
      });
    }

    const nextGlobalDelta = await this.getNextGlobalDelta(schemaVersion);
    if (nextGlobalDelta === null) {
      await this.finishMigrationProcess(jobParams);
      return;
    }

    this.deps.logger.info('Dispatching next migration job');
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
    schemaVersion: number
  ): Promise<{ migration: any; reindex: boolean; applied: boolean }> {
    const tenantNames = Object.keys(tenants.tenants);
    let appliedMigration: any = null;

    for (const tenantName of tenantNames) {
      // eslint-disable-next-line no-await-in-loop
      await tenants.run(async () => {
        const tenant = tenants.current();
        const { db } = DB.connectionForDB(tenant.dbName);
        const result = await this.deps.migrator.migrateDelta(db as Db, delta, schemaVersion);

        if (result.status === 'applied') {
          appliedMigration = result.migration;
        } else if (result.status === 'blocked') {
          this.deps.logger.error(
            `Data migration ${delta} blocked on tenant '${tenantName}' after schema advance`,
            {
              delta,
              tenant: tenantName,
              requiresSchema: result.blocked?.requiresSchema,
            }
          );
          throw new Error(
            `Migration ${delta} is blocked on tenant ${tenantName} requiring schema ${result.blocked?.requiresSchema}`
          );
        }
      }, tenantName);
    }

    return {
      migration: appliedMigration,
      reindex: appliedMigration?.reindex === true,
      applied: appliedMigration !== null,
    };
  }

  private async finishMigrationProcess(jobParams: Required<MigrationJobParams>): Promise<void> {
    this.deps.logger.info('No pending data migrations, running remaining schema migrations');

    const appliedSchemas = await this.deps.pgMigrator.migrate();
    jobParams.results.appliedSchemaDeltas.push(...appliedSchemas);

    this.deps.logger.info(
      `Schema migrations complete: applied [${appliedSchemas.join(', ') || 'none'}]`,
      {
        applied: appliedSchemas,
      }
    );

    if (jobParams.reindex) {
      this.deps.logger.info('Reindex requested, reindexing all tenants');
      await this.reindexAllTenants();
    }

    const summary = [
      'Migration run complete',
      `  Data migrations applied: [${jobParams.results.appliedDataDeltas.join(', ') || 'none'}]`,
      `  Schema migrations applied: [${jobParams.results.appliedSchemaDeltas.join(', ') || 'none'}]`,
      `  Reindex required: ${jobParams.reindex}`,
    ].join('\n');

    this.deps.logger.info(summary);
  }

  private async reindexAllTenants(): Promise<void> {
    const tenantNames = Object.keys(tenants.tenants);

    for (const tenantName of tenantNames) {
      // eslint-disable-next-line no-await-in-loop
      await tenants.run(async () => {
        await this.deps.reindexTenant();
      }, tenantName);
    }
  }
}

export { MigrationJob };
export type { MigrationJobDeps, MigrationJobParams, MigrationJobResults, MigratorLike };
