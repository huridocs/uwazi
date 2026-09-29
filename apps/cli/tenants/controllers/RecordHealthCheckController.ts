import { TenantUseCasesFactory } from '#api/tenants/infrastructure/TenantUseCasesFactory.js';
import type { RecordHealthCheckInput } from '#api/tenants/application/tenantInputs.js';
import type { TenantOutput } from '../contracts.js';

class RecordHealthCheckController {
  static async handle(input: RecordHealthCheckInput): Promise<TenantOutput> {
    return TenantUseCasesFactory.recordTenantHealthCheck().execute(input);
  }
}

export { RecordHealthCheckController };
