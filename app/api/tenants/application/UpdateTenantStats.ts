import type { UseCase } from '#api/core/libs/UseCase.js';
import type { TenantsDataSource, TenantRecord } from './contracts/TenantsDataSource.js';
import { TenantNotFound } from './errors.js';
import type { UpdateStatsInput } from './tenantInputs.js';

/** Stores the usage figures another tool computed. Uwazi keeps them and never reads them. */
class UpdateTenantStats implements UseCase<UpdateStatsInput, TenantRecord> {
  constructor(private readonly tenants: TenantsDataSource) {}

  async execute({ name, stats }: UpdateStatsInput): Promise<TenantRecord> {
    if (!(await this.tenants.getByName(name))) {
      throw new TenantNotFound(name);
    }

    return this.tenants.upsert(name, { stats });
  }
}

export { UpdateTenantStats };
