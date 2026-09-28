import { TenantUseCasesFactory } from '#api/tenants/infrastructure/TenantUseCasesFactory.js';
import type { TenantNameInput } from '#api/tenants/application/tenantInputs.js';

/** Removes the registry row only; the tenant's database, index and files are not touched. */
class DeleteTenantController {
  static async handle({ name }: TenantNameInput): Promise<{ name: string }> {
    await TenantUseCasesFactory.deregisterTenant().execute(name);

    return { name };
  }
}

export { DeleteTenantController };
