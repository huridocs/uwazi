import { Logger } from '#api/core/libs/logger/contracts/Logger.js';

type LogBase = { delta: number; migrationName: string; scope: 'tenant' | 'global' };

const errorFields = (error: unknown) => ({
  error: error instanceof Error ? error.message : String(error),
  // Postgres errors carry their SQLSTATE in `code`: groups timeouts, lock timeouts, constraints.
  errorCode:
    typeof (error as { code?: unknown })?.code === 'string'
      ? (error as { code: string }).code
      : undefined,
});

/**
 * The monitoring events of one data migration run. Every entry carries `event`, `delta`,
 * `migrationName` and `scope`; the tenant a tenant entry is about goes in `migrationTenant`, not
 * `tenant`, which the logger sets to the tenant the job runs as.
 */
class PgDataMigrationLog {
  private readonly startedAt = Date.now();

  constructor(
    private logger: Logger,
    private base: LogBase
  ) {}

  started(tenantCount?: number): void {
    this.logger.info(`Postgres data migration ${this.label()} started`, {
      ...this.fields('pg_data_migration.started'),
      tenantCount,
    });
  }

  tenantStarted(tenantId: string): void {
    this.logger.info(`Postgres data migration ${this.label()} started for '${tenantId}'`, {
      ...this.fields('pg_data_migration.tenant.started'),
      migrationTenant: tenantId,
    });
  }

  tenantSucceeded(tenantId: string, startedAt: number, reindex: boolean): void {
    this.logger.info(`Postgres data migration ${this.label()} succeeded for '${tenantId}'`, {
      ...this.fields('pg_data_migration.tenant.succeeded'),
      migrationTenant: tenantId,
      durationMs: Date.now() - startedAt,
      reindex,
    });
  }

  tenantFailed(tenantId: string, startedAt: number, error: unknown): void {
    this.logger.error(`Postgres data migration ${this.label()} failed for '${tenantId}'`, {
      ...this.fields('pg_data_migration.tenant.failed'),
      migrationTenant: tenantId,
      durationMs: Date.now() - startedAt,
      ...errorFields(error),
    });
  }

  completed(counts: { succeeded?: number; reindexTenants: number }): void {
    this.logger.info(`Postgres data migration ${this.label()} completed`, {
      ...this.fields('pg_data_migration.completed'),
      durationMs: this.elapsed(),
      ...counts,
    });
  }

  failed(error: unknown, counts: { succeeded?: number; failedTenants?: string[] } = {}): void {
    this.logger.error(`Postgres data migration ${this.label()} failed`, {
      ...this.fields('pg_data_migration.failed'),
      durationMs: this.elapsed(),
      failed: counts.failedTenants?.length,
      ...counts,
      ...errorFields(error),
    });
  }

  private label(): string {
    return `${this.base.delta} (${this.base.migrationName})`;
  }

  private fields(event: string) {
    return { event, ...this.base };
  }

  private elapsed(): number {
    return Date.now() - this.startedAt;
  }
}

export { PgDataMigrationLog };
