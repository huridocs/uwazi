import { TenantNotFound } from '#api/tenants/application/errors.js';
import type { TenantNameInput } from '#api/tenants/application/tenantInputs.js';
import { ArchivedTenantsDataSourceFactory } from '#api/tenants/infrastructure/ArchivedTenantsDataSourceFactory.js';
import { TenantUseCasesFactory } from '#api/tenants/infrastructure/TenantUseCasesFactory.js';

type DeleteTenantInput = TenantNameInput & { archived: boolean };

/** Removes the registry row only; the tenant's database, index and files are not touched. */
class DeleteTenantController {
  static async handle({ name, archived }: DeleteTenantInput): Promise<{ name: string }> {
    if (archived) {
      if (!(await ArchivedTenantsDataSourceFactory.default().delete(name))) {
        throw new TenantNotFound(name);
      }
      return { name };
    }

    await TenantUseCasesFactory.deregisterTenant().execute(name);

    return { name };
  }
}

export { DeleteTenantController };
