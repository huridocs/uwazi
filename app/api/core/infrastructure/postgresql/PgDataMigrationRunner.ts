import { Knex } from 'knex';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import {
  PgDataMigration,
  PgGlobalDataMigration,
  PgGlobalMigrationContext,
  PgTenantDataMigration,
  PgTenantMigrationContext,
} from './PgDataMigration.js';
import { PgDataMigrationFailed, TenantFailure } from './PgDataMigrationFailed.js';
import { PgDataMigrationLog } from './PgDataMigrationLog.js';

type PgDataMigrationRunnerDeps = {
  /** Table owner: RLS does not apply. For `global` migrations. */
  adminKnex: Knex;
  /** Application user: RLS applies. For `tenant` migrations. */
  appKnex: Knex;
  listTenants: () => string[];
  logger: Logger;
};

type RunInfo = { delta: number; name: string; heartbeat: () => Promise<void> };

type RunResult = { reindexTenants: string[] };

type TenantRun = { migration: PgTenantDataMigration; info: RunInfo; log: PgDataMigrationLog };

type TenantOutcome = { tenantId: string; reindex: boolean; failure?: TenantFailure };

/**
 * Runs one Postgres data migration. A `tenant` migration runs once per tenant, every tenant
 * attempted even when one fails; it succeeds only when it succeeded for all of them.
 */
class PgDataMigrationRunner {
  constructor(private deps: PgDataMigrationRunnerDeps) {}

  async run(migration: PgDataMigration, info: RunInfo): Promise<RunResult> {
    switch (migration.scope) {
      case 'global':
        return { reindexTenants: await this.runGlobal(migration, info) };
      case 'tenant':
        return { reindexTenants: await this.runForEveryTenant(migration, info) };
      default:
        throw new Error(
          `Migration ${info.delta} (${info.name}) must declare scope: 'tenant' or 'global'`
        );
    }
  }

  private async runGlobal(migration: PgGlobalDataMigration, info: RunInfo): Promise<string[]> {
    const log = new PgDataMigrationLog(this.deps.logger, {
      delta: info.delta,
      migrationName: info.name,
      scope: 'global',
    });
    const reindexTenants = new Set<string>();
    const ctx: PgGlobalMigrationContext = {
      knex: this.deps.adminKnex,
      logger: this.deps.logger,
      heartbeat: info.heartbeat,
      reindex: tenantIds => {
        PgDataMigrationRunner.assertReindexDeclared(migration, info);
        tenantIds.forEach(tenantId => reindexTenants.add(tenantId));
      },
    };

    log.started();
    try {
      await migration.up(ctx);
    } catch (error) {
      log.failed(error);
      throw error;
    }
    log.completed({ reindexTenants: reindexTenants.size });
    return [...reindexTenants];
  }

  private async runForEveryTenant(
    migration: PgTenantDataMigration,
    info: RunInfo
  ): Promise<string[]> {
    const log = new PgDataMigrationLog(this.deps.logger, {
      delta: info.delta,
      migrationName: info.name,
      scope: 'tenant',
    });
    const run: TenantRun = { migration, info, log };
    const tenantIds = [...this.deps.listTenants()].sort();

    log.started(tenantIds.length);
    return PgDataMigrationRunner.settle(run, await this.runEachTenant(run, tenantIds));
  }

  /** One after the other: tenants share the database with live traffic. */
  private async runEachTenant(run: TenantRun, tenantIds: string[]): Promise<TenantOutcome[]> {
    const outcomes: TenantOutcome[] = [];
    await tenantIds.reduce(async (previous, tenantId) => {
      await previous;
      outcomes.push(await this.runTenantLogged(run, tenantId));
      await run.info.heartbeat();
    }, Promise.resolve());
    return outcomes;
  }

  /** The tenants to reindex when every tenant succeeded; one error naming the failed ones if not. */
  private static settle(run: TenantRun, outcomes: TenantOutcome[]): string[] {
    const failures = outcomes.flatMap(outcome => (outcome.failure ? [outcome.failure] : []));
    const reindexTenants = outcomes.filter(outcome => outcome.reindex).map(o => o.tenantId);
    const succeeded = outcomes.length - failures.length;

    if (failures.length > 0) {
      const error = new PgDataMigrationFailed(run.info.delta, run.info.name, failures);
      run.log.failed(error, { succeeded, failedTenants: error.failedTenants });
      throw error;
    }
    run.log.completed({ succeeded, reindexTenants: reindexTenants.length });
    return reindexTenants;
  }

  private async runTenantLogged(run: TenantRun, tenantId: string): Promise<TenantOutcome> {
    const startedAt = Date.now();
    run.log.tenantStarted(tenantId);
    try {
      const reindex = await this.runTenant(run, tenantId);
      run.log.tenantSucceeded(tenantId, startedAt, reindex);
      return { tenantId, reindex };
    } catch (error) {
      run.log.tenantFailed(tenantId, startedAt, error);
      return { tenantId, reindex: false, failure: { tenantId, error } };
    }
  }

  /** Resolves true when the tenant asked to be reindexed. */
  private async runTenant({ migration, info }: TenantRun, tenantId: string): Promise<boolean> {
    let reindex = false;
    const ctx: PgTenantMigrationContext = {
      tenantId,
      transaction: async fn => this.tenantTransaction(tenantId, fn),
      logger: this.deps.logger,
      heartbeat: info.heartbeat,
      reindex: () => {
        PgDataMigrationRunner.assertReindexDeclared(migration, info);
        reindex = true;
      },
    };

    await migration.up(ctx);
    return reindex;
  }

  /**
   * Scopes the transaction to the tenant the way the application does: transaction local settings,
   * gone on commit or rollback. Entity permissions are bypassed; only tenant isolation applies.
   */
  private async tenantTransaction<T>(
    tenantId: string,
    fn: (trx: Knex.Transaction) => Promise<T>
  ): Promise<T> {
    return this.deps.appKnex.transaction(async trx => {
      await trx.raw("SELECT set_config('app.current_tenant', ?, true)", [tenantId]);
      await trx.raw("SELECT set_config('uwazi.bypass_rls', 'true', true)");
      return fn(trx);
    });
  }

  private static assertReindexDeclared(migration: PgDataMigration, info: RunInfo): void {
    if (!migration.reindex) {
      throw new Error(
        `Migration ${info.delta} (${info.name}) reported tenants to reindex but declares reindex: false`
      );
    }
  }
}

export { PgDataMigrationRunner };
export type { PgDataMigrationRunnerDeps, RunInfo, RunResult };
