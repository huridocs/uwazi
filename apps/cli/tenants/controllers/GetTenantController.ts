import { TenantNotFound } from '#api/tenants/application/errors.js';
import { TenantsDataSourceFactory } from '#api/tenants/infrastructure/TenantsDataSourceFactory.js';
import type { TenantNameInput } from '#api/tenants/application/tenantInputs.js';
import type { TenantOutput } from '../contracts.js';

class GetTenantController {
  static async handle({ name }: TenantNameInput): Promise<TenantOutput> {
    const tenant = await TenantsDataSourceFactory.default().getByName(name);

    if (!tenant) {
      throw new TenantNotFound(name);
    }

    return tenant;
  }
}

export { GetTenantController };
