import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { FootprintReaderFactory } from '../../infrastructure/factories/FootprintReaderFactory.js';
import { SearchIndexReaderFactory } from '../../infrastructure/factories/SearchIndexReaderFactory.js';

const f = getFixturesFactory();

const TENANT_ID = 'usage-footprint';
const OTHER_TENANT_ID = 'other-tenant';

const fixtures = {
  entities: [f.entity('entity1', 'template'), f.entity('entity2', 'template')],
  files: [f.document('doc1', { mimetype: 'application/pdf', size: 1000 })],
};

const insertEntity = async (id: string, tenantId: string) =>
  testingEnvironment.pg.pool!.query(
    `INSERT INTO entities ("_id", "tenant_id", "sharedId", "language", "title", "template",
                           "published", "creationDate", "editDate")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, tenantId, id, 'en', 'A title long enough to take some bytes', 'template', true, 1, 1]
  );

describe('FootprintReader', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true, elasticIndex: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    testingTenants.changeCurrentTenant({ name: TENANT_ID, featureFlags: { postgresCore: true } });
    await testingEnvironment.setFixtures(fixtures);
  });

  describe('MongoDB', () => {
    it('should report the bytes the tenant database takes', async () => {
      const bytes = await testingEnvironment.runWithContext(async () =>
        FootprintReaderFactory.mongo().databaseBytes()
      );

      expect(bytes).toBeGreaterThan(0);
    });
  });

  describe('PostgreSQL', () => {
    const databaseBytes = async () =>
      testingEnvironment.runWithContext(async () =>
        FootprintReaderFactory.postgres().databaseBytes()
      );

    it("should estimate the bytes of the tenant's rows", async () => {
      expect(await databaseBytes()).toBeGreaterThan(0);
    });

    it('should grow when the tenant stores more rows', async () => {
      const before = await databaseBytes();

      await insertEntity('extra-entity', TENANT_ID);

      expect(await databaseBytes()).toBeGreaterThan(before);
    });

    it("should not count another tenant's rows", async () => {
      const before = await databaseBytes();

      await insertEntity('foreign-entity', OTHER_TENANT_ID);

      expect(await databaseBytes()).toBe(before);
    });

    it('should report 0 for a tenant with no rows', async () => {
      testingTenants.changeCurrentTenant({ name: 'empty-tenant' });

      expect(await databaseBytes()).toBe(0);
    });
  });

  describe('Elasticsearch', () => {
    const indexBytes = async (indexName: string) =>
      testingEnvironment.runWithContext(async () =>
        SearchIndexReaderFactory.default().indexBytes(indexName)
      );

    it('should report the bytes the index takes', async () => {
      expect(await indexBytes(testingEnvironment.elasticIndex)).toBeGreaterThan(0);
    });

    it('should report 0 for an index that does not exist', async () => {
      expect(await indexBytes('usage_missing_index')).toBe(0);
    });
  });
});
