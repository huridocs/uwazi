import type { UseCase } from '#api/core/libs/UseCase.js';
import type { TenantsDataSource, TenantRecord } from './contracts/TenantsDataSource.js';
import { derivedPaths, type RegisterTenantInput } from './tenantInputs.js';

/**
 * Writes the registry row. Idempotent: registering a tenant that already exists updates it, which
 * is what the infrastructure automation that calls this relies on.
 */
class RegisterTenant implements UseCase<RegisterTenantInput, TenantRecord> {
  constructor(private readonly tenants: TenantsDataSource) {}

  async execute({ name, ...rest }: RegisterTenantInput): Promise<TenantRecord> {
    const defaults = { dbName: name, indexName: name, ...derivedPaths(name) };
    const given = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined)
    );

    return this.tenants.upsert(name, { ...defaults, ...given });
  }
}

export { RegisterTenant };
