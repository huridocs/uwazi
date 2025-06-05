import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoFilesDataSource } from '../MongoFilesDataSource';

const factory = getFixturesFactory();

const fixtures = {
  files: [
    factory.document('file1', { entity: 'entity1' }),
    factory.document('file2', { entity: 'entity2' }),
    factory.document('file3', { entity: 'entity3' }),
    factory.document('file4', { entity: 'entity1', language: 'en' }),
    factory.document('file5', { entity: 'entity1', language: 'es' }),
    factory.document('file6', { entity: 'entity1', language: 'it' }),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('MongoFilesDataSource', () => {
  describe('filesExistForEntities', () => {
    it('should return true if the file exists and belongs to the entity', async () => {
      const ds = new MongoFilesDataSource(getConnection(), DefaultTransactionManager());

      expect(
        await ds.filesExistForEntities([
          { entity: 'entity1', _id: factory.id('file1').toHexString() },
          { entity: 'entity2', _id: factory.id('file2').toHexString() },
        ])
      ).toBe(true);

      expect(
        await ds.filesExistForEntities([
          { entity: 'entity1', _id: factory.id('file3').toHexString() },
          { entity: 'entity2', _id: factory.id('file2').toHexString() },
        ])
      ).toBe(false);
    });
  });

  describe('getDocumentsForEntity', () => {
    it('should return the documents for an entity', async () => {
      const ds = new MongoFilesDataSource(getConnection(), DefaultTransactionManager());

      const documentsForEntity = await ds.getDocumentsForEntity('entity1').all();
      expect(documentsForEntity.length).toBe(4);
    });

    it('should allow fetching documents only in specific languages', async () => {
      const ds = new MongoFilesDataSource(getConnection(), DefaultTransactionManager());

      const documentsForEntity = await ds
        .getDocumentsForEntity('entity1', { languages: ['en', 'it'] })
        .all();

      expect(documentsForEntity.length).toBe(2);
      expect(documentsForEntity[0].filename).toBe('file4');
      expect(documentsForEntity[1].filename).toBe('file6');
    });
  });
});
