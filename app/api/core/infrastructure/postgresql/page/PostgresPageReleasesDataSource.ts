import { Db } from 'mongodb';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { Result } from '#api/core/libs/Result.js';
import { PageReleasesDataSource } from '#api/pages.v2/application/contracts/PageReleasesDataSource.js';
import { PageReleaseSnapshot } from '#api/pages.v2/domain/Page.js';
import { PageReleaseNotFoundError } from '#api/pages.v2/domain/errors.js';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';
import { PageReleaseRow, PostgresPageMapper } from './PostgresPageMapper.js';

export class PostgresPageReleasesDataSource
  extends PostgresDataSource<PageReleaseRow>
  implements PageReleasesDataSource
{
  private readonly idGenerator: IdGenerator;

  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
    idGenerator: IdGenerator;
  }) {
    super('page_releases', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'page_releases' },
    });
    this.idGenerator = deps.idGenerator;
  }

  async getMaxVersion(pageId: string): Promise<number> {
    const row = await this.table
      .where({ page_id: pageId })
      .orderBy('version', 'desc')
      .limit(1)
      .first();
    return row?.version ?? 0;
  }

  async insert(pageId: string, snapshot: PageReleaseSnapshot): Promise<void> {
    await this.table.insert(
      PostgresPageMapper.releaseSnapshotToRow(pageId, this.idGenerator.generate(), snapshot)
    );
  }

  async getByPageIdAndVersion(pageId: string, version: number) {
    const row = await this.table.where({ page_id: pageId, version }).first();
    if (!row) {
      return Result.fail(new PageReleaseNotFoundError(pageId, version));
    }
    return Result.ok(PostgresPageMapper.rowToReleaseSnapshot(row));
  }

  async listByPageId(pageId: string): Promise<PageReleaseSnapshot[]> {
    const rows = await this.table.where({ page_id: pageId }).orderBy('version').all();
    return rows.map(PostgresPageMapper.rowToReleaseSnapshot);
  }

  async deleteByPageId(pageId: string): Promise<void> {
    await this.table.where({ page_id: pageId }).delete();
  }
}
