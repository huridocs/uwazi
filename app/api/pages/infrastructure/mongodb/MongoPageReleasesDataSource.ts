import { Db, ObjectId } from 'mongodb';
import { PageReleasesDataSource } from '#api/pages/application/contracts/PageReleasesDataSource.js';
import { PageReleaseSnapshot } from '#api/pages/domain/Page.js';
import { PageReleaseNotFoundError } from '#api/pages/domain/errors.js';
import { Result } from '#api/core/libs/Result.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { PageReleaseDBO } from './PageDBO.js';
import { PageMapper } from './PageMapper.js';

class MongoPageReleasesDataSource
  extends MongoDataSource<PageReleaseDBO>
  implements PageReleasesDataSource
{
  protected collectionName = 'page_releases';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
  }

  async getMaxVersion(pageId: string): Promise<number> {
    const doc = await this.getCollection()
      .find({ page: ObjectId.createFromHexString(pageId) })
      .sort({ version: -1 })
      .limit(1)
      .next();
    return doc?.version ?? 0;
  }

  async insert(pageId: string, snapshot: PageReleaseSnapshot): Promise<void> {
    const dbo = PageMapper.releaseSnapshotToDBO(pageId, snapshot);
    await this.getCollection().insertOne(dbo, { ignoreUndefined: true });
  }

  async getByPageIdAndVersion(pageId: string, version: number) {
    const dbo = await this.getCollection().findOne({
      page: ObjectId.createFromHexString(pageId),
      version,
    });
    if (!dbo) {
      return Result.fail(new PageReleaseNotFoundError(pageId, version));
    }
    const languageKeys = Object.keys(dbo).filter(
      k => !['_id', 'page', 'version', 'release_message', 'user', 'date'].includes(k)
    );
    return Result.ok(PageMapper.releaseToSnapshot(dbo, languageKeys));
  }

  async listByPageId(pageId: string): Promise<PageReleaseSnapshot[]> {
    const dbos = await this.getCollection()
      .find({ page: ObjectId.createFromHexString(pageId) })
      .sort({ version: 1 })
      .toArray();

    return dbos.map(dbo => {
      const languageKeys = Object.keys(dbo).filter(
        k => !['_id', 'page', 'version', 'release_message', 'user', 'date'].includes(k)
      );
      return PageMapper.releaseToSnapshot(dbo, languageKeys);
    });
  }

  async deleteByPageId(pageId: string): Promise<void> {
    await this.getCollection().deleteMany({
      page: ObjectId.createFromHexString(pageId),
    });
  }
}

export { MongoPageReleasesDataSource };
