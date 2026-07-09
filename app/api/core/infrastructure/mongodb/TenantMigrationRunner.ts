import { Tenant } from '#api/tenants/tenantContext.js';

export type TenantMigrationResult =
  | { status: 'applied'; migration: any }
  | { status: 'blocked'; blocked: { delta: number; requiresSchema: number } }
  | { status: 'done' };

export type TenantPendingMigrations = {
  runnable: Array<{ delta: number; requiresSchema?: number }>;
  blocked: { delta: number; requiresSchema: number } | null;
};

export interface TenantMigrationRunner {
  getPendingMigrations(tenant: Tenant, schemaVersion: number): Promise<TenantPendingMigrations>;
  migrateDelta(
    tenant: Tenant,
    delta: number,
    schemaVersion: number
  ): Promise<TenantMigrationResult>;
}
