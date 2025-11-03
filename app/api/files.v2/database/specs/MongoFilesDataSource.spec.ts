import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoFilesDataSource } from '../MongoFilesDataSource';

const factory = getFixturesFactory();

const fixtures = {
  files: [
    factory.document('file1', {
      entity: 'entity1',
      extractedMetadata: [{ name: 'to_be_deleted' }, { name: 'property1' }],
    }),
    factory.document('file2', {
      entity: 'entity2',
      extractedMetadata: [
        { name: 'to_be_deleted' },
        { name: 'to_be_deleted_2' },
        { name: 'property2' },
      ],
    }),
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
  describe('deleteExtractedMetadata', () => {
    it('should delete extractedMetadata by name for files belonging to specified entities', async () => {
      const extractedMetadataToDelete = ['to_be_deleted', 'to_be_deleted_2'];
      const ds = new MongoFilesDataSource(getConnection(), TransactionManagerFactory.default());
      await ds.deleteExtractedMetadata(extractedMetadataToDelete, ['entity1']);

      let dbFiles = (await testingEnvironment.db.getAllFrom('files'))?.filter(
        f => f.extractedMetadata?.length
      );

      expect(dbFiles).toMatchObject([
        { entity: 'entity1', extractedMetadata: [{ name: 'property1' }] },
        {
          entity: 'entity2',
          extractedMetadata: [
            { name: 'to_be_deleted' },
            { name: 'to_be_deleted_2' },
            { name: 'property2' },
          ],
        },
      ]);

      await ds.deleteExtractedMetadata(extractedMetadataToDelete, ['entity2']);

      dbFiles = (await testingEnvironment.db.getAllFrom('files'))?.filter(
        f => f.extractedMetadata?.length
      );

      expect(dbFiles).toMatchObject([
        { entity: 'entity1', extractedMetadata: [{ name: 'property1' }] },
        { entity: 'entity2', extractedMetadata: [{ name: 'property2' }] },
      ]);
    });
  });

  describe('renameExtractedMetadata', () => {
    it('should rename extractedMetadata names based on a oldName:newName map for specified entities', async () => {
      const toRenameProperties = { property1: 'renamed1', property2: 'renamed2' };
      const ds = new MongoFilesDataSource(getConnection(), TransactionManagerFactory.default());
      await ds.renameExtractedMetadata(toRenameProperties, ['entity1']);

      let dbFiles = (await testingEnvironment.db.getAllFrom('files'))?.filter(
        f => f.extractedMetadata?.length
      );

      expect(dbFiles).toMatchObject([
        {
          entity: 'entity1',
          extractedMetadata: [{ name: 'to_be_deleted' }, { name: 'renamed1' }],
        },
        {
          entity: 'entity2',
          extractedMetadata: [
            { name: 'to_be_deleted' },
            { name: 'to_be_deleted_2' },
            { name: 'property2' },
          ],
        },
      ]);

      await ds.renameExtractedMetadata(toRenameProperties, ['entity2']);

      dbFiles = (await testingEnvironment.db.getAllFrom('files'))?.filter(
        f => f.extractedMetadata?.length
      );

      expect(dbFiles).toMatchObject([
        {
          entity: 'entity1',
          extractedMetadata: [{ name: 'to_be_deleted' }, { name: 'renamed1' }],
        },
        {
          entity: 'entity2',
          extractedMetadata: [
            { name: 'to_be_deleted' },
            { name: 'to_be_deleted_2' },
            { name: 'renamed2' },
          ],
        },
      ]);
    });
  });
  describe('filesExistForEntities', () => {
    it('should return true if the file exists and belongs to the entity', async () => {
      const ds = new MongoFilesDataSource(getConnection(), TransactionManagerFactory.default());

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
      const ds = new MongoFilesDataSource(getConnection(), TransactionManagerFactory.default());

      const documentsForEntity = await ds.getDocumentsForEntity('entity1').all();
      expect(documentsForEntity.length).toBe(4);
    });

    it('should allow fetching documents only in specific languages', async () => {
      const ds = new MongoFilesDataSource(getConnection(), TransactionManagerFactory.default());

      const documentsForEntity = await ds
        .getDocumentsForEntity('entity1', { languages: ['en', 'it'] })
        .all();

      expect(documentsForEntity.length).toBe(2);
      expect(documentsForEntity[0].filename).toBe('file4');
      expect(documentsForEntity[1].filename).toBe('file6');
    });
  });
});
