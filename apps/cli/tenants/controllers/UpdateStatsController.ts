import { TenantUseCasesFactory } from '#api/tenants/infrastructure/TenantUseCasesFactory.js';
import type { UpdateStatsInput } from '#api/tenants/application/tenantInputs.js';
import type { TenantOutput } from '../contracts.js';

class UpdateStatsController {
  static async handle(input: UpdateStatsInput): Promise<TenantOutput> {
    return TenantUseCasesFactory.updateTenantStats().execute(input);
  }
}

export { UpdateStatsController };
