import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import type { ActivityReader } from './contracts/ActivityReader.js';
import type { ContentUsageReader } from './contracts/ContentUsageReader.js';
import type { FootprintReader } from './contracts/FootprintReader.js';
import type { TenantUsage } from './TenantUsage.js';

type Deps = {
  content: ContentUsageReader;
  /** postgres is null while the tenant is not on PostgreSQL: it has no rows there to count. */
  footprint: { mongo: FootprintReader; postgres: FootprintReader | null };
  activity: ActivityReader;
};

/**
 * What the current tenant consumes: its content, the storage it takes in every database engine,
 * and when it was last used. A read for operators; nothing in Uwazi depends on it.
 */
class ReportTenantUsage extends AbstractUseCase<void, TenantUsage, Deps> {
  async execute(): Promise<TenantUsage> {
    const { content, footprint, activity } = this.deps;

    const [contentUsage, mongo, postgres, lastSession] = await ReportTenantUsage.allSettled([
      content.read(),
      footprint.mongo.databaseBytes(),
      footprint.postgres?.databaseBytes() ?? 0,
      activity.lastSession(this.tenant.name),
    ] as const);

    return {
      ...contentUsage,
      dbStorage: mongo + postgres,
      dbStorageByEngine: { mongo, postgres },
      lastSession,
    };
  }

  /**
   * Like Promise.all, but fails only once every read has finished: a read still running when the
   * report fails would outlive it, and its connection could be closed under it.
   */
  private static async allSettled<T extends readonly unknown[]>(
    reads: T
  ): Promise<{ -readonly [K in keyof T]: Awaited<T[K]> }> {
    const settled = await Promise.allSettled(reads);
    const failed = settled.find(result => result.status === 'rejected');
    if (failed) {
      throw failed.reason;
    }
    return settled.map(result => (result as PromiseFulfilledResult<unknown>).value) as {
      -readonly [K in keyof T]: Awaited<T[K]>;
    };
  }
}

export { ReportTenantUsage };
