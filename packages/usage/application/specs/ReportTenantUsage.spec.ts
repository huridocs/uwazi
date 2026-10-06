import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import type { Tenant } from '#api/tenants/tenantContext.js';
import { ReportTenantUsageFactory } from '../../infrastructure/factories/ReportTenantUsageFactory.js';
import { FileKind } from '../FileKind.js';
import { ReportTenantUsage } from '../ReportTenantUsage.js';

const f = getFixturesFactory();

const TENANT_ID = 'usage-report';
const LAST_ACTIVE = 1_700_000_000_000;

/** The shared database is shared by every test worker: only touch the session this spec owns. */
const SESSION_ID = 'usage-report-spec:session';

const fixtures = {
  entities: [...f.entityInMultipleLanguages(['en', 'es'], 'entity1', 'template')],
  files: [
    f.document('doc1', { mimetype: 'application/pdf', size: 1000 }),
    f.attachment('att1', { mimetype: 'image/png', size: 200 }),
  ],
};

const storeSession = async () =>
  DB.mongodb_Db(config.SHARED_DB)
    .collection<{ _id: string; session: string; lastModified: Date; expires: Date }>('sessions')
    .insertOne({
      _id: SESSION_ID,
      session: JSON.stringify({ passport: { user: `user1///${TENANT_ID}` } }),
      lastModified: new Date(LAST_ACTIVE),
      expires: new Date(LAST_ACTIVE + 1000),
    });

describe('ReportTenantUsage', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await DB.mongodb_Db(config.SHARED_DB)
      .collection<{ _id: string }>('sessions')
      .deleteMany({ _id: SESSION_ID });
    await storeSession();
  });

  const report = async () =>
    testingEnvironment.runWithContext(async () => ReportTenantUsageFactory.default().execute());

  describe.each([
    { name: 'MongoDB tenant', usePostgres: false },
    { name: 'PostgreSQL tenant', usePostgres: true },
  ])('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: usePostgres },
      });
      await testingEnvironment.setFixtures(fixtures);
    });

    it("should report the tenant's content and last activity", async () => {
      const usage = await report();

      expect(usage).toMatchObject({
        entitiesCount: 1,
        filesCount: { document: 1, attachment: 1, custom: 0, thumbnail: 0 },
        filesByBucket: {
          ...FileKind.empty(),
          pdf: { count: 1, size: 1000 },
          image: { count: 1, size: 200 },
        },
        filesStorage: 1200,
        lastSession: LAST_ACTIVE,
      });
      expect(usage).not.toHaveProperty('elasticStorage');
    });

    it('should add up the database storage of every engine', async () => {
      const { dbStorage, dbStorageByEngine } = await report();

      expect(dbStorageByEngine.mongo).toBeGreaterThan(0);
      expect(dbStorage).toBe(dbStorageByEngine.mongo + dbStorageByEngine.postgres);
    });
  });

  it('should not read PostgreSQL storage for a tenant still on MongoDB', async () => {
    testingTenants.changeCurrentTenant({ name: TENANT_ID, featureFlags: { postgresCore: false } });
    await testingEnvironment.setFixtures(fixtures);

    expect((await report()).dbStorageByEngine.postgres).toBe(0);
  });

  it('should read PostgreSQL storage for a tenant on PostgreSQL', async () => {
    testingTenants.changeCurrentTenant({ name: TENANT_ID, featureFlags: { postgresCore: true } });
    await testingEnvironment.setFixtures(fixtures);

    expect((await report()).dbStorageByEngine.postgres).toBeGreaterThan(0);
  });
});

describe('ReportTenantUsage when a read fails', () => {
  /** A failing session store: the reads are built in memory to make one of them fail. */
  it('should wait for every other read to finish before failing', async () => {
    let contentFinished = false;
    const content = {
      read: async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });
        contentFinished = true;
        return {
          entitiesCount: 0,
          filesCount: { document: 0, attachment: 0, custom: 0, thumbnail: 0 },
          filesByBucket: FileKind.empty(),
          filesStorage: 0,
        };
      },
    };
    const usage = new ReportTenantUsage(
      {
        content,
        footprint: { mongo: { databaseBytes: async () => 0 }, postgres: null },
        activity: { lastSession: async () => Promise.reject(new Error('Connection Error')) },
      },
      { tenant: { name: 'tenant' } as Tenant }
    );

    await expect(usage.execute()).rejects.toThrow('Connection Error');
    expect(contentFinished).toBe(true);
  });
});
