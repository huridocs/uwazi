import type { UseCase } from '#api/core/libs/UseCase.js';
import type { TenantsDataSource, TenantRecord } from './contracts/TenantsDataSource.js';
import { TenantNotFound } from './errors.js';
import type { SetMaintenanceInput } from './tenantInputs.js';

/** Puts a tenant under maintenance, or takes it out again. */
class SetTenantMaintenance implements UseCase<SetMaintenanceInput, TenantRecord> {
  constructor(private readonly tenants: TenantsDataSource) {}

  async execute({ name, maintenance }: SetMaintenanceInput): Promise<TenantRecord> {
    if (!(await this.tenants.getByName(name))) {
      throw new TenantNotFound(name);
    }

    return this.tenants.upsert(name, { maintenance });
  }
}

export { SetTenantMaintenance };
