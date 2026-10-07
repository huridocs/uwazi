import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import type { TenantUsage } from './application/TenantUsage.js';
import { ActivityReaderFactory } from './infrastructure/factories/ActivityReaderFactory.js';
import { ReportTenantUsageFactory } from './infrastructure/factories/ReportTenantUsageFactory.js';

/** How the host reaches the usage module. */
class UsageComposition {
  /** Runs in the current tenant's execution context. */
  static async reportForCurrentTenant(): Promise<TenantUsage> {
    return ReportTenantUsageFactory.default().execute();
  }

  /** Epoch ms of the current tenant's latest session activity; null when it has none. */
  static async lastSessionForCurrentTenant(): Promise<number | null> {
    return ActivityReaderFactory.default().lastSession(ExecutionContext.currentTenant.name);
  }
}

export { UsageComposition };
export type { TenantUsage } from './application/TenantUsage.js';
