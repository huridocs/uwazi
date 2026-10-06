import type { ContentUsage } from '../TenantUsage.js';

interface ContentUsageReader {
  /** Entities and files of the current tenant. */
  read(): Promise<ContentUsage>;
}

export type { ContentUsageReader };
