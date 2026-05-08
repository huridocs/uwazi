import { EntityPermissionChecker } from '#api/core/domain/entityAccessPolicy/EntityPermissionChecker.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { Result } from '#api/core/libs/Result.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { FileDelete } from '../FileDelete.js';

const f = getFixturesFactory();

const baseFixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [f.template('template1')],
};

const createSUT = () => {
  const transactionManager = TransactionManagerFactory.fake();

  const entityPermissions = TestUtils.mockClass<EntityPermissionChecker>({
    checkWritePermission: jest.fn().mockResolvedValue(Result.ok(true)),
  });

  return testingEnvironment.runWithContext(
    () =>
      new FileDelete(
        {
          transactionManager,
          filesDS: FilesDataSourceFactory.default(),
          entitiesDS: EntitiesDataSourceFactory.default({ transactionManager }),
          settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
          filesService: FilesServiceFactory.default(),
          entityPermissions,
        },
        { actor: { _id: 'aaaaaaaaaaaa', role: 'admin' } as any, tenant: { name: 'test' } as any }
      )
  );
};

describe('FileDelete - setPreview (real DB)', () => {
  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when thumbnails remain after deleting a document', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp({
        ...baseFixtures,
        entities: [
          f.entity('entity1', 'template1', {}, { language: 'en', preview: 'old.jpg' }),
          f.entity('entity1', 'template1', {}, { language: 'es', preview: 'old.jpg' }),
        ],
        files: [
          f.file('doc1', {
            type: 'document',
            status: 'ready',
            entity: 'entity1',
            language: 'en',
            mimetype: 'application/pdf',
          }),
          f.file('doc1-thumb', {
            type: 'thumbnail',
            entity: 'entity1',
            language: 'en',
            filename: `${f.idString('doc1')}.jpg`,
            mimetype: 'image/jpeg',
          }),
          f.file('doc2', {
            type: 'document',
            status: 'ready',
            entity: 'entity1',
            language: 'es',
            mimetype: 'application/pdf',
          }),
          f.file('doc2-thumb', {
            type: 'thumbnail',
            entity: 'entity1',
            language: 'es',
            filename: `${f.idString('doc2')}.jpg`,
            mimetype: 'image/jpeg',
          }),
        ],
      });
    });

    it('should recalculate preview from the surviving thumbnail', async () => {
      // delete doc1 (en) — doc2 (es) and its thumbnail survive
      await createSUT().execute({ fileId: f.idString('doc1') });

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity1' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity1' && e.language === 'es');

      expect(en?.preview).toBe(`${f.idString('doc2')}.jpg`);
      expect(es?.preview).toBe(`${f.idString('doc2')}.jpg`);
    });
  });

  describe('when no thumbnails remain after deleting the last document', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp({
        ...baseFixtures,
        entities: [
          f.entity('entity1', 'template1', {}, { language: 'en', preview: 'stale.jpg' }),
          f.entity('entity1', 'template1', {}, { language: 'es', preview: 'stale.jpg' }),
        ],
        files: [
          f.file('doc1', {
            type: 'document',
            status: 'ready',
            entity: 'entity1',
            language: 'en',
            mimetype: 'application/pdf',
          }),
        ],
      });
    });

    it('should clear preview from all entity translations', async () => {
      await createSUT().execute({ fileId: f.idString('doc1') });

      const entities = await testingEnvironment.db.getAllFrom('entities');
      const en = entities.find(e => e.sharedId === 'entity1' && e.language === 'en');
      const es = entities.find(e => e.sharedId === 'entity1' && e.language === 'es');

      expect(en?.preview).toBeUndefined();
      expect(es?.preview).toBeUndefined();
    });
  });
});
