import type { UseCase } from '#api/core/libs/UseCase.js';
import type { TenantsDataSource, TenantRecord } from './contracts/TenantsDataSource.js';
import { derivedPaths, type RegisterTenantInput } from './tenantInputs.js';

/**
 * Writes the registry row. Idempotent: registering a tenant that already exists updates it, which
 * is what the infrastructure automation that calls this relies on. Defaults only fill fields the
 * stored tenant does not have: registering again never moves a tenant to another database, index
 * or folder unless it is told to.
 */
class RegisterTenant implements UseCase<RegisterTenantInput, TenantRecord> {
  constructor(private readonly tenants: TenantsDataSource) {}

  async execute({ name, ...rest }: RegisterTenantInput): Promise<TenantRecord> {
    const stored = await this.tenants.getByName(name);
    const defaults = Object.fromEntries(
      Object.entries({ dbName: name, indexName: name, ...derivedPaths(name) }).filter(
        ([field]) => stored?.[field as keyof TenantRecord] === undefined
      )
    );
    const given = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined)
    );

    return this.tenants.upsert(name, { ...defaults, ...given });
  }
}

export { RegisterTenant };
