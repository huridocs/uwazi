import type { UseCase } from '#api/core/libs/UseCase.js';
import type { TenantsDataSource, TenantRecord } from './contracts/TenantsDataSource.js';
import { TenantNotFound } from './errors.js';
import type { SetFeatureFlagsInput } from './tenantInputs.js';

/**
 * Merges the flags it is sent: a flag sent as null is removed, a flag not sent is left alone.
 * Never replaces the whole object, so a caller cannot drop flags it does not know about.
 */
class SetTenantFeatureFlags implements UseCase<SetFeatureFlagsInput, TenantRecord> {
  constructor(private readonly tenants: TenantsDataSource) {}

  async execute({ name, featureFlags }: SetFeatureFlagsInput): Promise<TenantRecord> {
    if (!(await this.tenants.getByName(name))) {
      throw new TenantNotFound(name);
    }

    return this.tenants.upsert(name, { featureFlags });
  }
}

export { SetTenantFeatureFlags };
