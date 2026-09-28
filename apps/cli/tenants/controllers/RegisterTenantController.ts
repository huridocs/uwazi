import { TenantUseCasesFactory } from '#api/tenants/infrastructure/TenantUseCasesFactory.js';
import type { RegisterTenantInput } from '#api/tenants/application/tenantInputs.js';
import type { TenantOutput } from '../contracts.js';

class RegisterTenantController {
  static async handle(input: RegisterTenantInput): Promise<TenantOutput> {
    return TenantUseCasesFactory.registerTenant().execute(input);
  }
}

export { RegisterTenantController };
