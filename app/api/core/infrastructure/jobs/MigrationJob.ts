import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { Tenant, Tenants } from '#api/tenants/tenantContext.js';
import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
  Params,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import {
  TenantMigrationResult,
  TenantMigrationRunner,
} from '#api/core/infrastructure/mongodb/TenantMigrationRunner.js';

type MigrationJobResults = {
  appliedDataDeltas: number[];
  appliedSchemaDeltas: number[];
};

type MigrationJobParams = {
  /** Tenant names that applied at least one migration flagged with `reindex: true` in this run */
  reindexTenants?: string[];
  results?: MigrationJobResults;
};

type MigrationJobDeps = {
  runner: TenantMigrationRunner;
  pgMigrator: PgMigrator;
  logger: Logger;
  dispatcher: JobsDispatcher;
  reindexTenant: () => Promise<void>;
  tenantsManager: Tenants;
};

@PrivilegedJob()
class MigrationJob implements Dispatchable {
  constructor(private deps: MigrationJobDeps) {}

  async handleDispatch(
    heartbeat: HeartbeatCallback,
    params: Params,
    _jobInfo?: JobInfo
  ): Promise<void> {
    const jobParams = this.normalizeParams(params as MigrationJobParams);

    try {
      await this.runJob(jobParams, heartbeat);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.deps.logger.error(`Migration failed: ${message}`);
      throw error;
    }
  }

  private async runJob(
    jobParams: Required<MigrationJobParams>,
    heartbeat: HeartbeatCallback
  ): Promise<void> {
    this.deps.logger.info('Starting migration job');

    let schemaVersion = await this.deps.pgMigrator.getCurrentVersion();
    this.deps.logger.info(`Current schema version: ${schemaVersion}`);

    const nextDelta = await this.getNextGlobalDelta(schemaVersion);

    if (nextDelta === null) {
      await this.finishMigrationProcess(jobParams, heartbeat);
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

    const { reindexTenants: deltaReindexTenants, applied } = await this.runDeltaOnAllTenants(
      nextDelta,
      schemaVersion,
      heartbeat
    );
    const nextReindexTenants = Array.from(
      new Set([...jobParams.reindexTenants, ...deltaReindexTenants])
    );
    jobParams.reindexTenants = nextReindexTenants;

    if (applied && !jobParams.results.appliedDataDeltas.includes(nextDelta)) {
      jobParams.results.appliedDataDeltas.push(nextDelta);
    }

    if (applied) {
      this.deps.logger.info(`Applied data migration ${nextDelta}`, {
        delta: nextDelta,
        reindexTenants: nextReindexTenants,
      });
    } else {
      this.deps.logger.info(`Skipped data migration ${nextDelta} (already applied)`, {
        delta: nextDelta,
        reindexTenants: nextReindexTenants,
      });
    }

    const nextGlobalDelta = await this.getNextGlobalDelta(schemaVersion);
    if (nextGlobalDelta === null) {
      await this.finishMigrationProcess(jobParams, heartbeat);
      return;
    }

    this.deps.logger.info('Dispatching next migration job');
    await this.deps.dispatcher.dispatch(MigrationJob, {
      reindexTenants: nextReindexTenants,
      results: jobParams.results,
    });
  }

  private normalizeParams(params: MigrationJobParams): Required<MigrationJobParams> {
    return {
      reindexTenants: params.reindexTenants ?? [],
      results: params.results ?? { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    };
  }

  private async getNextGlobalDelta(schemaVersion: number): Promise<number | null> {
    const tenantNames = Object.keys(this.deps.tenantsManager.tenants);
    let minDelta: number | null = null;

    const updateMinDelta = (delta: number) => {
      if (minDelta === null || delta < minDelta) {
        minDelta = delta;
      }
    };

    for (const tenantName of tenantNames) {
      // eslint-disable-next-line no-await-in-loop
      await this.deps.tenantsManager.run(async () => {
        const tenant = this.deps.tenantsManager.current();
        const { runnable, blocked } = await this.deps.runner.getPendingMigrations(
          tenant,
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
    const tenantNames = Object.keys(this.deps.tenantsManager.tenants);
    if (tenantNames.length === 0) return null;

    const probeTenant =
      tenantNames.length > 1 && tenantNames[0] === 'default' ? tenantNames[1] : tenantNames[0];

    let blocked: { delta: number; requiresSchema: number } | null = null;

    await this.deps.tenantsManager.run(async () => {
      const tenant = this.deps.tenantsManager.current();
      const { runnable, blocked: pendingBlocked } = await this.deps.runner.getPendingMigrations(
        tenant,
        schemaVersion
      );

      const isTargetBlocked =
        pendingBlocked &&
        pendingBlocked.delta === delta &&
        !runnable.some(migration => migration.delta === delta);

      if (isTargetBlocked) {
        blocked = pendingBlocked;
      }
    }, probeTenant);

    return blocked;
  }

  private async runDeltaOnAllTenants(
    delta: number,
    schemaVersion: number,
    heartbeat: HeartbeatCallback
  ): Promise<{ reindexTenants: string[]; applied: boolean }> {
    const tenantNames = Object.keys(this.deps.tenantsManager.tenants);
    const reindexTenants: string[] = [];
    const results: TenantMigrationResult[] = [];

    for (const tenantName of tenantNames) {
      // eslint-disable-next-line no-await-in-loop
      await this.deps.tenantsManager.run(async () => {
        const tenant = this.deps.tenantsManager.current();
        if (!(await this.deps.runner.tenantExists(tenant))) {
          this.deps.logger.info(
            `Skipping tenant '${tenantName}': no settings collection, tenant is not ready`
          );
          results.push({ status: 'done' });
          return;
        }
        const result = await this.deps.runner.migrateDelta(tenant, delta, schemaVersion);
        results.push(result);
        if (result.status === 'applied' && result.migration?.reindex === true) {
          reindexTenants.push(tenantName);
        }
      }, tenantName);

      // eslint-disable-next-line no-await-in-loop
      await heartbeat();

      const result = results[results.length - 1];
      if (result.status === 'blocked') {
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
    }

    const appliedMigration = results.find(r => r.status === 'applied')?.migration;

    return {
      reindexTenants,
      applied: appliedMigration !== undefined,
    };
  }

  private async finishMigrationProcess(
    jobParams: Required<MigrationJobParams>,
    heartbeat: HeartbeatCallback
  ): Promise<void> {
    this.deps.logger.info('No pending data migrations, running remaining schema migrations');

    const appliedSchemas = await this.deps.pgMigrator.migrate();
    jobParams.results.appliedSchemaDeltas.push(...appliedSchemas);

    this.deps.logger.info(
      `Schema migrations complete: applied [${appliedSchemas.join(', ') || 'none'}]`,
      {
        applied: appliedSchemas,
      }
    );

    if (jobParams.reindexTenants.length > 0) {
      this.deps.logger.info(
        `Reindex requested for tenants: [${jobParams.reindexTenants.join(', ')}]`,
        { tenants: jobParams.reindexTenants }
      );
      await this.reindexTenants(jobParams.reindexTenants, heartbeat);
    }

    const summary = [
      'Migration run complete',
      `  Data migrations applied: [${jobParams.results.appliedDataDeltas.join(', ') || 'none'}]`,
      `  Schema migrations applied: [${jobParams.results.appliedSchemaDeltas.join(', ') || 'none'}]`,
      `  Reindexed tenants: [${jobParams.reindexTenants.join(', ') || 'none'}]`,
    ].join('\n');

    this.deps.logger.info(summary);
  }

  private async reindexTenants(tenantNames: string[], heartbeat: HeartbeatCallback): Promise<void> {
    for (const tenantName of tenantNames) {
      // eslint-disable-next-line no-await-in-loop
      await this.deps.tenantsManager.run(async () => {
        const tenant = this.deps.tenantsManager.current();
        if (await this.deps.runner.tenantExists(tenant)) {
          await this.reindexTenant(tenant);
        } else {
          this.deps.logger.info(
            `Skipping reindex for tenant '${tenantName}': no settings collection, tenant is not ready`
          );
        }
      }, tenantName);
      // eslint-disable-next-line no-await-in-loop
      await heartbeat();
    }
  }

  private async reindexTenant(tenant: Tenant): Promise<void> {
    await this.deps.tenantsManager.setMaintenance(tenant.name, true);
    this.deps.logger.info(`Tenant '${tenant.name}' set to maintenance mode for reindex`);

    try {
      await this.deps.reindexTenant();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.deps.logger.error(
        `Reindex failed for tenant '${tenant.name}', keeping maintenance mode: ${message}`
      );
      throw error;
    }

    await this.deps.tenantsManager.setMaintenance(tenant.name, false);
    this.deps.logger.info(`Tenant '${tenant.name}' removed from maintenance mode after reindex`);
  }
}

export { MigrationJob };
export type { MigrationJobDeps, MigrationJobParams, MigrationJobResults };
