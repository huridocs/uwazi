import type { UseCase } from '#api/core/libs/UseCase.js';
import type { TenantsDataSource, TenantRecord } from './contracts/TenantsDataSource.js';
import { TenantNotFound } from './errors.js';
import type { UpdateTenantInput } from './tenantInputs.js';

/** Changes an existing tenant. Omitted fields are left alone, fields sent as null are removed. */
class UpdateTenant implements UseCase<UpdateTenantInput, TenantRecord> {
  constructor(private readonly tenants: TenantsDataSource) {}

  async execute({ name, ...patch }: UpdateTenantInput): Promise<TenantRecord> {
    if (!(await this.tenants.getByName(name))) {
      throw new TenantNotFound(name);
    }

    return this.tenants.upsert(name, patch);
  }
}

export { UpdateTenant };
