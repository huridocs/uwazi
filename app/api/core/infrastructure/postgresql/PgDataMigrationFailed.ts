type TenantFailure = { tenantId: string; error: unknown };

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** A tenant scoped data migration failed for some tenants. The others ran to completion. */
class PgDataMigrationFailed extends Error {
  readonly failedTenants: string[];

  readonly failures: TenantFailure[];

  constructor(delta: number, name: string, failures: TenantFailure[]) {
    super(
      `Migration ${delta} (${name}) failed for ${failures.length} tenant(s): ${failures
        .map(failure => `${failure.tenantId}: ${messageOf(failure.error)}`)
        .join('; ')}`
    );
    this.name = 'PgDataMigrationFailed';
    this.failures = failures;
    this.failedTenants = failures.map(failure => failure.tenantId);
  }
}

export { PgDataMigrationFailed };
export type { TenantFailure };
