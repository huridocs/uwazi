import { ObjectId } from 'mongodb';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PageReleaseSnapshot } from '#api/pages.v2/domain/Page.js';
import { PageReleaseNotFoundError } from '#api/pages.v2/domain/errors.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresPageReleasesDataSource } from '../PostgresPageReleasesDataSource.js';

const TENANT_ID = 'test-tenant';
const PAGE_ID = new ObjectId().toHexString();
const USER_ID = new ObjectId().toHexString();

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDS = (tenantId = TENANT_ID) =>
  new PostgresPageReleasesDataSource({
    tenantId,
    mongoDb: getConnection(),
    pgTransactionManager: managerFor(tenantId),
    idGenerator: IdGeneratorFactory.default(),
  });

const snapshot = (version: number, overrides: Partial<PageReleaseSnapshot> = {}) => ({
  version,
  releaseMessage: `release ${version}`,
  userId: USER_ID,
  date: 1700000000 + version,
  locales: {
    en: { title: 'Title EN', draft: { content: '<p>EN</p>', script: 'en.js', css: 'en.css' } },
    es: { title: 'Title ES', draft: { content: '<p>ES</p>', script: '', css: '' } },
  },
  ...overrides,
});

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingEnvironment.setUp({});
  await testingPG.clear(['page_releases']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresPageReleasesDataSource', () => {
  describe('insert / getByPageIdAndVersion', () => {
    it('should round-trip a release snapshot', async () => {
      const ds = makeDS();
      const release = snapshot(1);

      await ds.insert(PAGE_ID, release);

      const found = (await ds.getByPageIdAndVersion(PAGE_ID, 1)).getDataOrThrow();
      expect(found).toEqual(release);
    });

    it('should keep releases of different pages apart', async () => {
      const ds = makeDS();
      const otherPageId = new ObjectId().toHexString();
      await ds.insert(PAGE_ID, snapshot(1));
      await ds.insert(otherPageId, snapshot(1, { releaseMessage: 'other page' }));

      const found = (await ds.getByPageIdAndVersion(otherPageId, 1)).getDataOrThrow();
      expect(found.releaseMessage).toBe('other page');
    });

    it('should fail with PageReleaseNotFoundError when the version does not exist', async () => {
      const ds = makeDS();
      await ds.insert(PAGE_ID, snapshot(1));

      const result = await ds.getByPageIdAndVersion(PAGE_ID, 2);

      expect(result.getError()).toBeInstanceOf(PageReleaseNotFoundError);
    });

    it('should not read a release belonging to a different tenant', async () => {
      await makeDS('other-tenant').insert(PAGE_ID, snapshot(1));

      const result = await makeDS().getByPageIdAndVersion(PAGE_ID, 1);

      expect(result.getError()).toBeInstanceOf(PageReleaseNotFoundError);
    });
  });

  describe('getMaxVersion', () => {
    it('should return 0 when the page has no releases', async () => {
      expect(await makeDS().getMaxVersion(PAGE_ID)).toBe(0);
    });

    it('should return the highest version of the page only', async () => {
      const ds = makeDS();
      await ds.insert(PAGE_ID, snapshot(1));
      await ds.insert(PAGE_ID, snapshot(3));
      await ds.insert(PAGE_ID, snapshot(2));
      await ds.insert(new ObjectId().toHexString(), snapshot(9));

      expect(await ds.getMaxVersion(PAGE_ID)).toBe(3);
    });
  });

  describe('listByPageId', () => {
    it('should list the page releases ordered by version', async () => {
      const ds = makeDS();
      await ds.insert(PAGE_ID, snapshot(2));
      await ds.insert(PAGE_ID, snapshot(1));
      await ds.insert(new ObjectId().toHexString(), snapshot(1));

      const releases = await ds.listByPageId(PAGE_ID);

      expect(releases.map(release => release.version)).toEqual([1, 2]);
      expect(releases[0]).toEqual(snapshot(1));
    });

    it('should return an empty list when the page has no releases', async () => {
      expect(await makeDS().listByPageId(PAGE_ID)).toEqual([]);
    });
  });

  describe('deleteByPageId', () => {
    it('should remove every version of the page and leave other pages alone', async () => {
      const ds = makeDS();
      const otherPageId = new ObjectId().toHexString();
      await ds.insert(PAGE_ID, snapshot(1));
      await ds.insert(PAGE_ID, snapshot(2));
      await ds.insert(otherPageId, snapshot(1));

      await ds.deleteByPageId(PAGE_ID);

      expect(await ds.listByPageId(PAGE_ID)).toEqual([]);
      expect(await ds.listByPageId(otherPageId)).toHaveLength(1);
    });
  });
});
