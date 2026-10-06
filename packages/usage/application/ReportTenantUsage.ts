import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import type { ActivityReader } from './contracts/ActivityReader.js';
import type { ContentUsageReader } from './contracts/ContentUsageReader.js';
import type { FootprintReader } from './contracts/FootprintReader.js';
import type { SearchIndexReader } from './contracts/SearchIndexReader.js';
import type { TenantUsage } from './TenantUsage.js';

type Deps = {
  content: ContentUsageReader;
  /** postgres is null while the tenant is not on PostgreSQL: it has no rows there to count. */
  footprint: { mongo: FootprintReader; postgres: FootprintReader | null };
  searchIndex: SearchIndexReader;
  activity: ActivityReader;
};

/**
 * What the current tenant consumes: its content, the storage it takes in every engine and its
 * search index, and when it was last used. A read for operators; nothing in Uwazi depends on it.
 */
class ReportTenantUsage extends AbstractUseCase<void, TenantUsage, Deps> {
  async execute(): Promise<TenantUsage> {
    const { content, footprint, searchIndex, activity } = this.deps;
    const { name, indexName } = this.tenant;

    const [contentUsage, mongo, postgres, elasticStorage, lastSession] = await Promise.all([
      content.read(),
      footprint.mongo.databaseBytes(),
      footprint.postgres?.databaseBytes() ?? 0,
      searchIndex.indexBytes(indexName),
      activity.lastSession(name),
    ]);

    return {
      ...contentUsage,
      dbStorage: mongo + postgres,
      dbStorageByEngine: { mongo, postgres },
      elasticStorage,
      lastSession,
    };
  }
}

export { ReportTenantUsage };
