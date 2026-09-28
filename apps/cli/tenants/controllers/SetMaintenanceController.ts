import { TenantUseCasesFactory } from '#api/tenants/infrastructure/TenantUseCasesFactory.js';
import type { SetMaintenanceInput } from '#api/tenants/application/tenantInputs.js';
import type { TenantOutput } from '../contracts.js';

class SetMaintenanceController {
  static async handle(input: SetMaintenanceInput): Promise<TenantOutput> {
    return TenantUseCasesFactory.setTenantMaintenance().execute(input);
  }
}

export { SetMaintenanceController };
