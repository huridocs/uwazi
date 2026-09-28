import { TenantUseCasesFactory } from '#api/tenants/infrastructure/TenantUseCasesFactory.js';
import type { SetFeatureFlagsInput } from '#api/tenants/application/tenantInputs.js';
import type { TenantOutput } from '../contracts.js';

class SetFeatureFlagsController {
  static async handle(input: SetFeatureFlagsInput): Promise<TenantOutput> {
    return TenantUseCasesFactory.setTenantFeatureFlags().execute(input);
  }
}

export { SetFeatureFlagsController };
