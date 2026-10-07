import type { TenantUsage } from './application/TenantUsage.js';
import { ReportTenantUsageFactory } from './infrastructure/factories/ReportTenantUsageFactory.js';

/** How the host reaches the usage module. */
class UsageComposition {
  /** Runs in the current tenant's execution context. */
  static async reportForCurrentTenant(): Promise<TenantUsage> {
    return ReportTenantUsageFactory.default().execute();
  }
}

export { UsageComposition };
