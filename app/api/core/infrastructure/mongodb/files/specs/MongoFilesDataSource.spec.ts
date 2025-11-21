import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { DiskFile } from 'api/files.v2/model/DiskFile';
import { Document } from 'api/files.v2/model/Document';
import { FileNotFound } from 'api/files.v2/model/errors';
import { ProcessedDocument } from 'api/files.v2/model/ProcessedDocument';
import { FileBuilder } from 'api/files.v2/specs/FileBuilder';
import { elasticTesting } from 'api/utils/elastic_testing';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { MongoFilesDataSource } from '../MongoFilesDataSource';

const f = getFixturesFactory();

const fixtures = {
  files: [
    f.document('file1', {
      entity: 'entity1',
      extractedMetadata: [{ name: 'to_be_deleted' }, { name: 'property1' }],
      status: 'ready',
    }),
    f.document('file2', {
      entity: 'entity2',
      extractedMetadata: [
        { name: 'to_be_deleted' },
        { name: 'to_be_deleted_2' },
        { name: 'property2' },
      ],
    }),
    f.document('file3', { entity: 'entity3' }),
    f.document('file4', { entity: 'entity1', language: 'en', status: 'ready' }),
    f.document('file5', { entity: 'entity1', language: 'es', status: 'ready' }),
    f.document('file6', { entity: 'entity1', language: 'it', status: 'ready' }),
    f.document('processingDocument', {
      entity: 'entity3',
      language: 'en',
      status: 'processing',
    }),
    f.document('anotherProcessingDoc', {
      entity: 'another_entity_to_reindex',
      language: 'en',
      status: 'processing',
    }),
  ],

  templates: [f.template('template')],

  entities: [
    f.entity('entity_to_reindex', 'template', {}),
    f.entity('another_entity_to_reindex', 'template', {}),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

const createDs = () => {
  const transactionManager = TransactionManagerFactory.default();
  const ds = new MongoFilesDataSource(
    getConnection(),
    transactionManager,
    FileStorageFactory.default()
  );

  return { ds, transactionManager };
};

describe('MongoFilesDataSource', () => {
  describe('getProcessingById', () => {
    it('should get processing documents by id', async () => {
      const { ds } = createDs();
      const notProcessed = await ds.getProcessingById(f.idString('file3'));
      expect(notProcessed.isError()).toBe(true);

      const processed = (
        await ds.getProcessingById(f.idString('processingDocument'))
      ).getDataOrThrow();
      expect(processed).toBeInstanceOf(Document);
    });
  });

  describe('update', () => {
    it('should update and reindex related entity if file type is "processedDocument"', async () => {
      await testingEnvironment.setUp(fixtures, true);
      const { ds, transactionManager } = createDs();
      const processingDoc = (
        await ds.getProcessingById(f.idString('anotherProcessingDoc'))
      ).getDataOrThrow();
      await transactionManager.run(async () => {
        await ds.update(
          ProcessedDocument.fromDocument(processingDoc, {
            language: 'en',
            totalPages: 10,
            fullText: { 1: 'processed document' },
          })
        );
      });

      await elasticTesting.refresh();
      expect((await elasticTesting.getIndexedFullTextFromFiles())[0].fullText_english).toBe(
        'processed document'
      );
    });

    it('should update and reindex related entity if file type is "Document"', async () => {
      await testingEnvironment.setUp(fixtures, true);
      const { ds, transactionManager } = createDs();
      const processingDoc = (
        await ds.getProcessingById(f.idString('anotherProcessingDoc'))
      ).getDataOrThrow();
      await transactionManager.run(async () => {
        processingDoc.failed();
        await ds.update(processingDoc);
      });

      await elasticTesting.refresh();
      //@ts-ignore
      expect((await elasticTesting.getIndexedEntities())[0].documents[0].status).toBe('failed');
    });
  });
  describe('create', () => {
    it('should reindex related entity if file type is "processedDocument"', async () => {
      await testingEnvironment.setUp(fixtures, true);
      const { ds, transactionManager } = createDs();
      await transactionManager.run(async () => {
        await ds.create(
          new ProcessedDocument({
            id: f.idString('new document'),
            entity: 'entity_to_reindex',
            originalname: 'file.pdf',
            mimetype: 'application/pdf',
            size: 1,
            filename: 'file.pdf',
            language: 'en',
            totalPages: 1,
            creationDate: 0,
            uploaded: true,
            fullText: { 1: 'fullText' },
            content: new DiskFile('fake/path').toContent(),
          })
        );
      });

      await elasticTesting.refresh();
      expect((await elasticTesting.getIndexedFullTextFromFiles())[0].fullText_english).toBe(
        'fullText'
      );
    });
    it('should reindex related entity if file type is "Document"', async () => {
      await testingEnvironment.setUp(fixtures, true);
      const { ds, transactionManager } = createDs();
      await transactionManager.run(async () => {
        await ds.create(
          new Document({
            status: 'failed',
            id: f.idString('new document'),
            entity: 'entity_to_reindex',
            originalname: 'file.pdf',
            mimetype: 'application/pdf',
            size: 1,
            filename: 'file.pdf',
            creationDate: 0,
            uploaded: true,
            content: new DiskFile('fake/path').toContent(),
          })
        );
      });

      await elasticTesting.refresh();
      //@ts-ignore
      expect((await elasticTesting.getIndexedEntities())[1].documents[0].status).toBe('failed');
    });
  });

  describe('deleteExtractedMetadata', () => {
    it('should delete extractedMetadata by name for files belonging to specified entities', async () => {
      const extractedMetadataToDelete = ['to_be_deleted', 'to_be_deleted_2'];
      const { ds } = createDs();
      await ds.deleteExtractedMetadata(extractedMetadataToDelete, ['entity1']);

      let dbFiles = (await testingEnvironment.db.getAllFrom('files'))?.filter(
        file => file.extractedMetadata?.length
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
        file => file.extractedMetadata?.length
      );

      expect(dbFiles).toMatchObject([
        { entity: 'entity1', extractedMetadata: [{ name: 'property1' }] },
        { entity: 'entity2', extractedMetadata: [{ name: 'property2' }] },
      ]);
    });
  });

  describe('renameExtractedMetadata', () => {
    it('should rename extractedMetadata names based on a oldName:newName map for specified entities', async () => {
      const toRenameProperties = {
        property1: 'renamed1',
        property2: 'renamed2',
      };
      const { ds } = createDs();
      await ds.renameExtractedMetadata(toRenameProperties, ['entity1']);

      let dbFiles = (await testingEnvironment.db.getAllFrom('files'))?.filter(
        file => file.extractedMetadata?.length
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
        file => file.extractedMetadata?.length
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
      const { ds } = createDs();

      expect(
        await ds.filesExistForEntities([
          { entity: 'entity1', _id: f.id('file1').toHexString() },
          { entity: 'entity2', _id: f.id('file2').toHexString() },
        ])
      ).toBe(true);

      expect(
        await ds.filesExistForEntities([
          { entity: 'entity1', _id: f.id('file3').toHexString() },
          { entity: 'entity2', _id: f.id('file2').toHexString() },
        ])
      ).toBe(false);
    });
  });

  describe('getDocumentsForEntity', () => {
    it('should return the processed documents (type: "ready") for an entity', async () => {
      const { ds } = createDs();

      const documentsForEntity = await ds.getProcessedDocsForEntity('entity1').all();
      expect(documentsForEntity.length).toBe(4);
    });

    it('should allow fetching documents only in specific languages', async () => {
      const { ds } = createDs();

      const documentsForEntity = await ds
        .getProcessedDocsForEntity('entity1', { languages: ['en', 'it'] })
        .all();

      expect(documentsForEntity.length).toBe(2);
      expect(documentsForEntity[0].filename).toBe('file4');
      expect(documentsForEntity[1].filename).toBe('file6');
    });
  });

  describe('getByFilename', () => {
    it('should return file matching filename', async () => {
      const { ds } = createDs();
      const doc = (await ds.getByFilename('file2')).getData();
      expect(doc).toBeInstanceOf(Document);
    });

    it('should return FileNotFound when restricting filetype', async () => {
      const { ds } = createDs();
      const error = (await ds.getByFilename('file2', ['attachment'])).getError();
      expect(error).toBeInstanceOf(FileNotFound);
    });

    it('should return file when file type restriction match', async () => {
      const { ds } = createDs();
      const doc = (await ds.getByFilename('file3', ['document', 'attachment'])).getData();
      expect(doc).toBeInstanceOf(Document);
    });
  });

  describe('bulkCreate', () => {
    it('should insert documents into db', async () => {
      const { ds } = createDs();

      const doc = FileBuilder.document(f.idString('docId'), {
        entity: 'new_entity',
      });
      const attachment = FileBuilder.attachment(f.idString('attachmentId'), {
        entity: 'new_entity',
      });

      await ds.bulkCreate([doc, attachment]);

      const dbFiles = (await testingEnvironment.db.getAllFrom('files'))?.filter(
        file => file.entity === 'new_entity'
      );

      expect(dbFiles).toMatchObject([
        { _id: f.id('docId') },
        {
          _id: f.id('attachmentId'),
        },
      ]);
    });
  });
});
