import type { FeatureFlagsPatch } from '../../featureFlags.js';
import type { TenantMetadataPatch, TenantOperationalData } from '../../operationalData.js';
import type { Tenant } from '../../tenant.js';

/**
 * One stored tenant. Every field but `name` is optional: rows are written by several tools and
 * the registry has never required them. It is wider than `Tenant` — it also carries the
 * operational data uwazi stores for other tools but never reads.
 */
type TenantRecord = Partial<Tenant> & TenantOperationalData & { name: string };

type Nullable<T> = { [K in keyof T]?: T[K] | null };

/**
 * `undefined` leaves a field alone, `null` removes it, anything else sets it. `featureFlags` and
 * `metadata` merge key by key, with the same rules one level down.
 */
type TenantPatch = Omit<Nullable<Omit<TenantRecord, 'name'>>, 'featureFlags' | 'metadata'> & {
  featureFlags?: FeatureFlagsPatch | null;
  metadata?: TenantMetadataPatch | null;
};

/**
 * Persistence for the tenant registry, which lives in the shared database and therefore above
 * every tenant context. Reads and writes only: no rules, no validation.
 */
interface TenantsDataSource {
  all(): Promise<TenantRecord[]>;
  getByName(name: string): Promise<TenantRecord | undefined>;
  upsert(name: string, patch: TenantPatch): Promise<TenantRecord>;
  delete(name: string): Promise<boolean>;
}

export type { TenantPatch, TenantRecord, TenantsDataSource };
