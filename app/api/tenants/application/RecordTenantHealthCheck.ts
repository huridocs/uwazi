import type { UseCase } from '#api/core/libs/UseCase.js';
import type { TenantsDataSource, TenantRecord } from './contracts/TenantsDataSource.js';
import { TenantNotFound } from './errors.js';
import type { RecordHealthCheckInput } from './tenantInputs.js';

/** Keeps the latest health check only, as the tool writing them expects. */
class RecordTenantHealthCheck implements UseCase<RecordHealthCheckInput, TenantRecord> {
  constructor(private readonly tenants: TenantsDataSource) {}

  async execute({ name, healthCheck }: RecordHealthCheckInput): Promise<TenantRecord> {
    if (!(await this.tenants.getByName(name))) {
      throw new TenantNotFound(name);
    }

    return this.tenants.upsert(name, { healthChecks: [healthCheck] });
  }
}

export { RecordTenantHealthCheck };
