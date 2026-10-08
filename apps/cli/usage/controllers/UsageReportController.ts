import { UsageComposition } from '#usage/composition';
import type { TenantUsage } from '#usage';
import type { UsageReportOutput } from '../contracts.js';

class UsageReportController {
  static async handle(): Promise<UsageReportOutput> {
    return UsageReportController.toOutput(await UsageComposition.reportForCurrentTenant());
  }

  /** Field by field, so a change to the read model cannot leak into the CLI contract. */
  private static toOutput(usage: TenantUsage): UsageReportOutput {
    return {
      entitiesCount: usage.entitiesCount,
      filesCount: { ...usage.filesCount },
      filesByBucket: { ...usage.filesByBucket },
      filesStorage: usage.filesStorage,
      dbStorage: usage.dbStorage,
      dbStorageByEngine: { ...usage.dbStorageByEngine },
      lastSession: usage.lastSession,
    };
  }
}

export { UsageReportController };
