import { TenantUseCasesFactory } from '#api/tenants/infrastructure/TenantUseCasesFactory.js';
import type { UpdateTenantInput } from '#api/tenants/application/tenantInputs.js';
import type { TenantOutput } from '../contracts.js';

class UpdateTenantController {
  static async handle(input: UpdateTenantInput): Promise<TenantOutput> {
    return TenantUseCasesFactory.updateTenant().execute(input);
  }
}

export { UpdateTenantController };
