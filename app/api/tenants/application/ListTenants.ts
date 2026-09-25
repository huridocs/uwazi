import type { UseCase } from '#api/core/libs/UseCase.js';
import type { TenantsDataSource, TenantRecord } from './contracts/TenantsDataSource.js';

/** Every registered tenant, as stored. */
class ListTenants implements UseCase<void, TenantRecord[]> {
  constructor(private readonly tenants: TenantsDataSource) {}

  async execute(): Promise<TenantRecord[]> {
    return this.tenants.all();
  }
}

export { ListTenants };
