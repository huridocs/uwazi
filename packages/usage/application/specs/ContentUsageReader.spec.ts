import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ContentUsageReaderFactory } from '../../infrastructure/factories/ContentUsageReaderFactory.js';
import { FileKind } from '../FileKind.js';

const f = getFixturesFactory();

const TENANT_ID = 'usage-content';
const OTHER_TENANT_ID = 'other-tenant';

const fixtures = {
  entities: [
    ...f.entityInMultipleLanguages(['en', 'es'], 'entity1', 'template'),
    ...f.entityInMultipleLanguages(['en', 'es'], 'entity2', 'template'),
    f.entity('entity3', 'template'),
  ],
  files: [
    f.document('doc1', { mimetype: 'application/pdf', size: 1000 }),
    f.document('doc2', { mimetype: 'application/pdf', size: 3000 }),
    f.attachment('att1', { mimetype: 'image/png', size: 200 }),
    f.attachment('att2', { mimetype: 'image/jpeg', size: 300 }),
    f.attachment('att3', { mimetype: 'application/zip' }),
    f.custom_upload('custom1', { mimetype: 'text/css', size: 50 }),
    f.file('thumb1', { type: 'thumbnail', mimetype: 'image/jpeg', size: 10 }),
    f.attachment('att4', { mimetype: '', size: 5 }),
  ],
};

const expectedUsage = {
  entitiesCount: 3,
  filesCount: { document: 2, attachment: 4, custom: 1, thumbnail: 1 },
  filesByBucket: {
    ...FileKind.empty(),
    pdf: { count: 2, size: 4000 },
    image: { count: 3, size: 510 },
    text: { count: 1, size: 50 },
    other: { count: 1, size: 0 },
    unknown: { count: 1, size: 5 },
  },
  filesStorage: 4565,
};

describe('ContentUsageReader', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each([
    { name: 'MongoDB', usePostgres: false },
    { name: 'PostgreSQL', usePostgres: true },
  ])('$name', ({ usePostgres }) => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: usePostgres },
      });
    });

    const sut = () => testingEnvironment.runWithContext(() => ContentUsageReaderFactory.default());

    it('should count entities once per sharedId and files by type, kind and size', async () => {
      await testingEnvironment.setFixtures(fixtures);

      expect(await sut().read()).toEqual(expectedUsage);
    });

    it('should report zeros when the tenant has no content', async () => {
      await testingEnvironment.setFixtures({ entities: [], files: [] });

      expect(await sut().read()).toEqual({
        entitiesCount: 0,
        filesCount: { document: 0, attachment: 0, custom: 0, thumbnail: 0 },
        filesByBucket: FileKind.empty(),
        filesStorage: 0,
      });
    });
  });

  describe('PostgreSQL tenant isolation', () => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: true },
      });

      await testingEnvironment.setFixtures(fixtures);

      // Seeded through the admin pool: testingPG.setFixtures truncates each table it writes.
      const pool = testingEnvironment.pg.pool!;
      await pool.query(
        `INSERT INTO entities ("_id", "tenant_id", "sharedId", "language", "title", "template",
                               "published", "creationDate", "editDate")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        ['foreign-entity', OTHER_TENANT_ID, 'foreign', 'en', 'Foreign', 'template', true, 1, 1]
      );
      await pool.query(
        `INSERT INTO files ("_id", "tenant_id", "originalname", "filename", "mimetype", "size", "type")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'foreign-file',
          OTHER_TENANT_ID,
          'foreign.pdf',
          'foreign.pdf',
          'application/pdf',
          99999,
          'document',
        ]
      );
    });

    it("should not count another tenant's rows", async () => {
      const usage = await testingEnvironment.runWithContext(async () =>
        ContentUsageReaderFactory.default().read()
      );

      expect(usage).toEqual(expectedUsage);
    });
  });
});
