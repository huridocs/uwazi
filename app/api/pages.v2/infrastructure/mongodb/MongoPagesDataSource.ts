import { Db } from 'mongodb';
import { PagesDataSource } from '#api/pages.v2/application/contracts/PagesDataSource.js';
import { Page } from '#api/pages.v2/domain/Page.js';
import { PageNotFoundError } from '#api/pages.v2/domain/errors.js';
import { Result } from '#api/core/libs/Result.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { PageDBO } from './PageDBO.js';
import { PageMapper } from './PageMapper.js';

class MongoPagesDataSource extends MongoDataSource<PageDBO> implements PagesDataSource {
  protected collectionName = 'pages';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
  }

  async getBySharedId(sharedId: string) {
    const dbo = await this.getCollection().findOne({ sharedId });
    if (!dbo?.locales || Object.keys(dbo.locales).length === 0) {
      return Result.fail(new PageNotFoundError(sharedId));
    }
    return Result.ok(PageMapper.toDomain(dbo));
  }

  async getAll(): Promise<Page[]> {
    const dbos = await this.getCollection()
      .find({ locales: { $exists: true } })
      .toArray();
    return dbos.map(dbo => PageMapper.toDomain(dbo));
  }

  async create(page: Page): Promise<void> {
    const dbo = PageMapper.toDBO(page);
    await this.getCollection().insertOne(dbo, { ignoreUndefined: true });
  }

  async update(page: Page): Promise<void> {
    const dbo = PageMapper.toDBO(page);
    await this.getCollection().updateOne(
      { _id: dbo._id },
      { $set: dbo },
      { ignoreUndefined: true }
    );
  }

  async deleteBySharedId(sharedId: string): Promise<void> {
    await this.getCollection().deleteMany({ sharedId });
  }

  async countPagesMissingLocale(language: string): Promise<number> {
    const all = await this.getAll();
    return all.filter(page => !page.getLocaleKeys().includes(language)).length;
  }
}

export { MongoPagesDataSource };
