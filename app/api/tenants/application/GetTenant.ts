import type { UseCase } from '#api/core/libs/UseCase.js';
import type { TenantsDataSource, TenantRecord } from './contracts/TenantsDataSource.js';
import { TenantNotFound } from './errors.js';

/** One registered tenant, as stored. */
class GetTenant implements UseCase<string, TenantRecord> {
  constructor(private readonly tenants: TenantsDataSource) {}

  async execute(name: string): Promise<TenantRecord> {
    const tenant = await this.tenants.getByName(name);

    if (!tenant) {
      throw new TenantNotFound(name);
    }

    return tenant;
  }
}

export { GetTenant };
