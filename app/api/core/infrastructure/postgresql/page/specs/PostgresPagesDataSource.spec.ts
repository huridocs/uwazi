import { ObjectId } from 'mongodb';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { Page, PageLocaleData } from '#api/pages.v2/domain/Page.js';
import { PageNotFoundError } from '#api/pages.v2/domain/errors.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresTable } from '../../common/PostgresTable.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PageLocaleRow } from '../PostgresPageMapper.js';
import { PostgresPagesDataSource } from '../PostgresPagesDataSource.js';

const TENANT_ID = 'test-tenant';

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDS = (tenantId = TENANT_ID) =>
  new PostgresPagesDataSource({
    tenantId,
    mongoDb: getConnection(),
    pgTransactionManager: managerFor(tenantId),
  });

const localesTable = (tenantId = TENANT_ID) =>
  PostgresTable.for<PageLocaleRow>({
    tableName: 'page_locales',
    tenantId,
    transactionManager: managerFor(tenantId),
  });

const locale = (title: string, content = ''): PageLocaleData => ({
  title,
  draft: { content, script: '', css: '' },
});

const buildPage = (
  sharedId: string,
  locales: Record<string, PageLocaleData>,
  overrides: { id?: string; entityView?: boolean; markdownSupport?: boolean } = {}
) =>
  new Page({
    id: overrides.id ?? new ObjectId().toHexString(),
    sharedId,
    creationDate: 1700000000,
    entityView: overrides.entityView ?? false,
    markdownSupport: overrides.markdownSupport ?? false,
    locales,
  });

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingEnvironment.setUp({});
  await testingPG.clear(['pages', 'page_locales']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresPagesDataSource', () => {
  describe('create / getBySharedId', () => {
    it('should round-trip a page with all its locales', async () => {
      const ds = makeDS();
      const page = buildPage(
        'shared-1',
        { en: locale('Title EN', '<p>EN</p>'), es: locale('Title ES') },
        { entityView: true, markdownSupport: true }
      );

      await ds.create(page);
      const found = (await ds.getBySharedId('shared-1')).getDataOrThrow();

      expect(found.id).toBe(page.id);
      expect(found.sharedId).toBe('shared-1');
      expect(found.creationDate).toBe(1700000000);
      expect(found.entityView).toBe(true);
      expect(found.markdownSupport).toBe(true);
      expect(found.getLocales()).toEqual(page.getLocales());
    });

    it('should fail with PageNotFoundError when the page does not exist', async () => {
      const result = await makeDS().getBySharedId('missing');

      expect(result.getError()).toBeInstanceOf(PageNotFoundError);
    });

    it('should fail with PageNotFoundError when the page has no locales', async () => {
      const ds = makeDS();
      await ds.create(buildPage('shared-1', {}));

      const result = await ds.getBySharedId('shared-1');

      expect(result.getError()).toBeInstanceOf(PageNotFoundError);
    });

    it('should not read a page belonging to a different tenant', async () => {
      await makeDS('other-tenant').create(buildPage('shared-1', { en: locale('Title EN') }));

      const result = await makeDS().getBySharedId('shared-1');

      expect(result.getError()).toBeInstanceOf(PageNotFoundError);
    });
  });

  describe('getAll', () => {
    it('should return every page with its own locales, skipping pages without any', async () => {
      const ds = makeDS();
      await ds.create(buildPage('shared-1', { en: locale('Title EN', '<p>EN</p>') }));
      await ds.create(buildPage('shared-2', { es: locale('Title ES'), fr: locale('Titre FR') }));
      await ds.create(buildPage('shared-3', {}));

      const pages = await ds.getAll();

      expect(pages.map(page => page.sharedId).sort()).toEqual(['shared-1', 'shared-2']);
      const [first, second] = pages.sort((a, b) => a.sharedId.localeCompare(b.sharedId));
      expect(first.getLocales()).toEqual({ en: locale('Title EN', '<p>EN</p>') });
      expect(second.getLocales()).toEqual({ es: locale('Title ES'), fr: locale('Titre FR') });
    });
  });

  describe('update', () => {
    it('should persist changed flat fields', async () => {
      const ds = makeDS();
      const page = buildPage('shared-1', { en: locale('Title EN') });
      await ds.create(page);

      page.entityView = true;
      page.markdownSupport = true;
      await ds.update(page);

      const found = (await ds.getBySharedId('shared-1')).getDataOrThrow();
      expect(found.entityView).toBe(true);
      expect(found.markdownSupport).toBe(true);
    });

    it('should persist changed locale content', async () => {
      const ds = makeDS();
      const page = buildPage('shared-1', { en: locale('Title EN') });
      await ds.create(page);

      page.updateLocale('en', locale('New EN', '<p>new</p>'));
      await ds.update(page);

      const found = (await ds.getBySharedId('shared-1')).getDataOrThrow();
      expect(found.getLocale('en')).toEqual(locale('New EN', '<p>new</p>'));
    });

    it('should add new locales and drop removed ones', async () => {
      const ds = makeDS();
      const page = buildPage('shared-1', { en: locale('Title EN'), es: locale('Title ES') });
      await ds.create(page);

      page.addLocale('fr', 'en');
      page.removeLocale('es');
      await ds.update(page);

      const found = (await ds.getBySharedId('shared-1')).getDataOrThrow();
      expect(found.getLocaleKeys().sort()).toEqual(['en', 'fr']);
      expect(await localesTable().where({ page_id: page.id }).count()).toBe(2);
    });
  });

  describe('deleteBySharedId', () => {
    it('should remove the page and all of its locale rows', async () => {
      const ds = makeDS();
      const page = buildPage('shared-1', { en: locale('Title EN'), es: locale('Title ES') });
      await ds.create(page);
      await ds.create(buildPage('shared-2', { en: locale('Kept') }));

      await ds.deleteBySharedId('shared-1');

      expect((await ds.getBySharedId('shared-1')).getError()).toBeInstanceOf(PageNotFoundError);
      expect(await localesTable().where({ page_id: page.id }).count()).toBe(0);
      expect((await ds.getBySharedId('shared-2')).getDataOrThrow().sharedId).toBe('shared-2');
    });
  });

  describe('countPagesMissingLocale', () => {
    it('should count only pages that have locales but not the requested one', async () => {
      const ds = makeDS();
      await ds.create(buildPage('shared-1', { en: locale('Title EN'), es: locale('Title ES') }));
      await ds.create(buildPage('shared-2', { es: locale('Title ES') }));
      await ds.create(buildPage('shared-3', { es: locale('Title ES') }));
      await ds.create(buildPage('shared-4', {}));

      expect(await ds.countPagesMissingLocale('en')).toBe(2);
      expect(await ds.countPagesMissingLocale('es')).toBe(0);
    });
  });
});
