import type { FeatureFlagsPatch } from '../../featureFlags.js';
import type { Tenant } from '../../tenant.js';

/**
 * One stored tenant. Every field but `name` is optional: rows are written by several tools and
 * the registry has never required them.
 */
type TenantRecord = Partial<Tenant> & { name: string };

type Nullable<T> = { [K in keyof T]?: T[K] | null };

/** `undefined` leaves a field alone, `null` removes it, anything else sets it. */
type TenantPatch = Omit<Nullable<Omit<TenantRecord, 'name'>>, 'featureFlags'> & {
  featureFlags?: FeatureFlagsPatch | null;
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
