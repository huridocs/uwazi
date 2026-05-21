import { Db, ObjectId } from 'mongodb';
import { PagesDataSource } from '#api/pages/application/contracts/PagesDataSource.js';
import { Page } from '#api/pages/domain/Page.js';
import { PageNotFoundError } from '#api/pages/domain/errors.js';
import { Result } from '#api/core/libs/Result.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { PageDBO } from './PageDBO.js';
import { PageMapper } from './PageMapper.js';

const pageHasSlug = (page: Page, slug: string) =>
  page.getLocaleKeys().some(lang => page.getLocale(lang).slug === slug);

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

  /** See app/api/pages/TECH_DEBT.md — full scan until slug index exists. */
  async getBySlug(slug: string) {
    const pages = await this.getAll();
    const page = pages.find(p => pageHasSlug(p, slug));
    if (!page) {
      return Result.fail(new PageNotFoundError(slug));
    }
    return Result.ok(page);
  }

  async existsWithSlug(slug: string, excludeSharedId?: string): Promise<boolean> {
    const pages = await this.getAll();
    return pages.some(
      p => p.sharedId !== excludeSharedId && pageHasSlug(p, slug)
    );
  }

  async getAll(): Promise<Page[]> {
    const dbos = await this.getCollection().find({ locales: { $exists: true } }).toArray();
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

  async existsWithLocale(language: string): Promise<boolean> {
    const count = await this.getCollection().countDocuments(
      { [`locales.${language}`]: { $exists: true } },
      { limit: 1 }
    );
    return count > 0;
  }
}

export { MongoPagesDataSource };
