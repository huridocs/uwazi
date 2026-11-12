/**
 * An archived tenant row, as stored. Deliberately loose: the exact snapshot shape is a policy the
 * archive command owns (see `toArchivedRecord`), not a persistence contract, so the data source
 * copies whatever the caller hands it and returns whatever the store holds.
 */
type ArchivedTenantRecord = Record<string, unknown>;

/**
 * Persistence for the archived tenant registry, which lives next to the tenant registry on the
 * same backend (`TENANTS_BACKEND`) and therefore above every tenant context. Reads and writes
 * only: no rules, no validation.
 */
interface ArchivedTenantsDataSource {
  /** Every archived tenant, newest `archivedAt` first, ties by name. */
  newestFirst(): Promise<ArchivedTenantRecord[]>;
  getByName(name: string): Promise<ArchivedTenantRecord | undefined>;
  /** Writes the row under `name`, replacing whatever was there, and returns it as stored. */
  upsert(name: string, row: ArchivedTenantRecord): Promise<ArchivedTenantRecord>;
  delete(name: string): Promise<boolean>;
}

export type { ArchivedTenantRecord, ArchivedTenantsDataSource };
