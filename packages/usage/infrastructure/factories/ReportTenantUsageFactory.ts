import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ReportTenantUsage } from '../../application/ReportTenantUsage.js';
import { ActivityReaderFactory } from './ActivityReaderFactory.js';
import { ContentUsageReaderFactory } from './ContentUsageReaderFactory.js';
import { FootprintReaderFactory } from './FootprintReaderFactory.js';

class ReportTenantUsageFactory {
  static default(): ReportTenantUsage {
    const tenant = ExecutionContext.currentTenant;

    return new ReportTenantUsage(
      {
        content: ContentUsageReaderFactory.default(),
        footprint: {
          mongo: FootprintReaderFactory.mongo(),
          postgres: tenant.featureFlags?.postgresCore ? FootprintReaderFactory.postgres() : null,
        },
        activity: ActivityReaderFactory.default(),
      },
      { tenant }
    );
  }
}

export { ReportTenantUsageFactory };
