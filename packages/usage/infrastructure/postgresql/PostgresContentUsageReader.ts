import type { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import type { ContentUsageReader } from '../../application/contracts/ContentUsageReader.js';
import { FileUsage, type FileGroup } from '../../application/FileUsage.js';
import type { ContentUsage } from '../../application/TenantUsage.js';

type FileGroupRow = { type: string; mimetype: string; count: number; size: string };

/** Usage is a system read: every entity counts, whatever its permissions. */
const SYSTEM_READ = { bypass: true, refIds: [] };

class PostgresContentUsageReader implements ContentUsageReader {
  constructor(
    private readonly deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager }
  ) {}

  async read(): Promise<ContentUsage> {
    return this.deps.pgTransactionManager.withConnection(async trx => {
      const entities = await trx.raw<{ rows: { total: number }[] }>(
        'SELECT count(DISTINCT "sharedId")::int AS total FROM entities WHERE "tenant_id" = ?',
        [this.deps.tenantId]
      );

      const files = await trx.raw<{ rows: FileGroupRow[] }>(
        `SELECT "type", "mimetype", count(*)::int AS count, coalesce(sum("size"), 0) AS size
           FROM files
          WHERE "tenant_id" = ?
          GROUP BY "type", "mimetype"`,
        [this.deps.tenantId]
      );

      return {
        entitiesCount: entities.rows[0]?.total ?? 0,
        ...FileUsage.summarize(files.rows.map(PostgresContentUsageReader.toFileGroup)),
      };
    }, SYSTEM_READ);
  }

  private static toFileGroup({ type, mimetype, count, size }: FileGroupRow): FileGroup {
    return { type, mimetype, count, size: Number(size) };
  }
}

export { PostgresContentUsageReader };
