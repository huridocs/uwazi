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

    await migration.up(ctx);
    return [...reindexTenants];
  }

  private async runForEveryTenant(
    migration: PgTenantDataMigration,
    info: RunInfo
  ): Promise<string[]> {
    const reindexTenants: string[] = [];
    const failures: TenantFailure[] = [];

    await [...this.deps.listTenants()].sort().reduce(async (previous, tenantId) => {
      await previous;
      try {
        if (await this.runTenant(migration, tenantId, info)) reindexTenants.push(tenantId);
      } catch (error) {
        failures.push({ tenantId, error });
      }
      await info.heartbeat();
    }, Promise.resolve());

    if (failures.length > 0) {
      throw new PgDataMigrationFailed(info.delta, info.name, failures);
    }
    return reindexTenants;
  }

  /** Resolves true when the tenant asked to be reindexed. */
  private async runTenant(
    migration: PgTenantDataMigration,
    tenantId: string,
    info: RunInfo
  ): Promise<boolean> {
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
