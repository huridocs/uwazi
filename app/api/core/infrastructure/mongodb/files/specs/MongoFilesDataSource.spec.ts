import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { ProcessingPDF } from '#api/core/domain/files/ProcessingPDF.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import { ProcessedPDF } from '#api/core/domain/files/ProcessedPDF.js';
import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { URLAttachment } from '#api/core/domain/files/URLAttachment.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { search } from '#api/search/index.js';
import { elasticTesting } from '#api/utils/elastic_testing.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoFilesDataSource } from '../MongoFilesDataSource.js';

const f = getFixturesFactory();

const fixtures = {
  files: [
    ...f.processedDocument('processed1', {
      entity: 'entity1',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
      fullText: { 1: 'fullText' },
      extractedMetadata: [{ name: 'to_be_deleted' }, { name: 'property1' }],
    }),
    ...f.processedDocument('processed2', {
      entity: 'entity1',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    f.document('file2', {
      entity: 'entity2',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
      extractedMetadata: [
        { name: 'to_be_deleted' },
        { name: 'to_be_deleted_2' },
        { name: 'property2' },
      ],
    }),
    f.document('file3', {
      entity: 'entity3',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    f.document('file4', {
      entity: 'entity1',
      language: 'en',
      status: 'ready',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    f.document('file5', {
      entity: 'entity1',
      language: 'es',
      status: 'ready',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    f.document('file6', {
      entity: 'entity1',
      language: 'it',
      status: 'ready',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    f.document('processingDocument', {
      entity: 'entity3',
      language: 'en',
      status: 'processing',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    f.document('anotherProcessingDoc', {
      entity: 'another_entity_to_reindex',
      language: 'en',
      status: 'processing',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1000,
    }),
    f.attachment('url_attachment', {
      url: 'my_url',
      mimetype: 'text/html',
      size: 100,
      creationDate: 1000,
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
  describe('getAll', () => {
    it('should return all files', async () => {
      const { ds } = createDs();
      const all = await ds.getAll().all();

      expect(all.length).toBe(12);
    });
    it('should not return fullText', async () => {
      const { ds } = createDs();
      const all = await ds.getAll().all();

      const processed = all.find(file => file.filename === 'processed1');
      //@ts-ignore
      expect(processed.fullText).toBe(undefined);
    });
  });
  describe('getProcessingById', () => {
    it('should get processing documents by id', async () => {
      const { ds } = createDs();
      const notProcessed = await ds.getProcessingById(f.idString('file3'));
      expect(notProcessed.isError()).toBe(true);

      const processed = (
        await ds.getProcessingById(f.idString('processingDocument'))
      ).getDataOrThrow();
      expect(processed).toBeInstanceOf(ProcessingPDF);
    });
  });

  describe('getByEntitiesIds', () => {
    it('should get files belonging to entities', async () => {
      const { ds } = createDs();
      const files = await ds.getByEntitiesIds(['entity2', 'entity3']).all();

      expect(files).toMatchObject([
        { filename: 'file2' },
        { filename: 'file3' },
        { filename: 'processingDocument' },
      ]);
      const processed = (
        await ds.getProcessingById(f.idString('processingDocument'))
      ).getDataOrThrow();
      expect(processed).toBeInstanceOf(ProcessingPDF);
    });
  });

  describe('update', () => {
    it('should update and reindex related entity if file belongs to an entity', async () => {
      jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
      await testingEnvironment.setUp(fixtures);
      const { ds, transactionManager } = createDs();

      await transactionManager.run(async () => {
        await ds.update(FileBuilder.document(f.idString('doc'), { entity: 'entity1' }));
        await ds.update(FileBuilder.attachment(f.idString('attachment'), { entity: 'entity2' }));
      });

      expect(search.indexEntities).toHaveBeenCalledWith(
        {
          sharedId: { $in: ['entity1', 'entity2'] },
        },
        undefined
      );

      jest.mocked(search.indexEntities).mockReset();

      await transactionManager.run(async () => {
        await ds.update(FileBuilder.customUpload(f.idString('custom')));
      });

      expect(search.indexEntities).not.toHaveBeenCalled();
    });

    it('should update and reindex related entity if file type is a "FileWithContents"', async () => {
      jest.mocked(search.indexEntities).mockRestore();
      await testingEnvironment.setUp(fixtures, true);
      const { ds, transactionManager } = createDs();
      const processingDoc = (
        await ds.getProcessingById(f.idString('anotherProcessingDoc'))
      ).getDataOrThrow();
      await transactionManager.run(async () => {
        await ds.update(
          processingDoc.asProcessed({
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
  });
  describe('create', () => {
    it('should reindex related entity if file type is entity file', async () => {
      await testingEnvironment.setUp(fixtures, true);
      const { ds, transactionManager } = createDs();
      await transactionManager.run(async () => {
        await ds.create(
          new ProcessedPDF({
            id: f.idString('new document'),
            entity: 'entity_to_reindex',
            originalname: 'file.pdf',
            mimetype: 'application/pdf',
            size: 1,
            filename: 'file.pdf',
            language: 'en',
            totalPages: 1,
            generatedToc: false,
            creationDate: 1000,
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
          new ProcessingPDF({
            status: 'failed',
            id: f.idString('new document'),
            entity: 'entity_to_reindex',
            originalname: 'file.pdf',
            mimetype: 'application/pdf',
            size: 1,
            filename: 'file.pdf',
            creationDate: 1000,
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
          { entity: 'entity1', _id: f.id('processed1').toHexString() },
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
      expect(documentsForEntity.length).toBe(5);
    });

    it('should not return fullText', async () => {
      const { ds } = createDs();

      const documentsForEntity = await ds.getProcessedDocsForEntity('entity1').all();
      const processed = documentsForEntity.find(file => file.filename === 'processed1');
      //@ts-ignore
      expect(processed.fullText).toBe(undefined);
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
      expect(doc).toBeInstanceOf(ProcessingPDF);
    });

    it('should return FileNotFound when restricting filetype', async () => {
      const { ds } = createDs();
      const error = (await ds.getByFilename('file2', ['attachment'])).getError();
      expect(error).toBeInstanceOf(FileNotFound);
    });

    it('should return file when file type restriction match', async () => {
      const { ds } = createDs();
      const doc = (await ds.getByFilename('file3', ['document', 'attachment'])).getData();
      expect(doc).toBeInstanceOf(ProcessingPDF);
    });
    it('should return URLAttachment properly (with nullFileContents)', async () => {
      const { ds } = createDs();
      const doc = (await ds.getByFilename('url_attachment')).getData();
      expect(doc).toBeInstanceOf(URLAttachment);
      expect(doc?.content).toBeUndefined();
    });

    it('should not load fullText by default', async () => {
      const { ds } = createDs();
      const doc = (await ds.getByFilename('processed1')).getData();
      //@ts-ignore
      expect(doc?.fullText).toBeUndefined();
    });
  });

  describe('getById', () => {
    it('should return file matching id', async () => {
      const { ds } = createDs();
      const doc = (await ds.getById(f.idString('processed1'))).getData();
      expect(doc).toBeInstanceOf(ProcessedPDF);
    });

    it('should not load fullText by default', async () => {
      const { ds } = createDs();
      const doc = (await ds.getById(f.idString('processed1'))).getData();
      //@ts-ignore
      expect(doc?.fullText).toBeUndefined();
    });

    it('should return URLAttachment properly (with nullFileContents)', async () => {
      const { ds } = createDs();
      const doc = (await ds.getById(f.idString('url_attachment'))).getData();
      expect(doc).toBeInstanceOf(URLAttachment);
      expect(doc?.content).toBeUndefined();
    });
  });

  describe('getThumbnails', () => {
    it('should return thumbnails for ProcessedDocuments', async () => {
      const { ds } = createDs();
      const processed = [
        (await ds.getById(f.idString('processed1'))).getDataOrThrow() as ProcessedPDF,
        (await ds.getById(f.idString('processed2'))).getDataOrThrow() as ProcessedPDF,
      ];
      const thumbnails = await ds.getThumbnails(processed).all();
      expect(thumbnails[0]).toBeInstanceOf(Thumbnail);
      expect(thumbnails[1]).toBeInstanceOf(Thumbnail);
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

  describe('delete', () => {
    it('should delete files from db', async () => {
      const { ds } = createDs();
      const files = [
        FileBuilder.document(f.idString('file1')),
        FileBuilder.document(f.idString('file2')),
      ];
      await ds.delete(files);

      const dbFiles = (await testingEnvironment.db.getAllFrom('files'))?.filter(
        file =>
          file._id.toString() === f.idString('file1') || file._id.toString() === f.idString('file2')
      );

      expect(dbFiles).toMatchObject([]);
    });
  });
});
