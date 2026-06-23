/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { PostgresFilesDataSource } from '../PostgresFilesDataSource.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { FileAttachment } from '#api/core/domain/files/FileAttachment.js';
import { URLAttachment } from '#api/core/domain/files/URLAttachment.js';
import { CustomUpload } from '#api/core/domain/files/CustomUpload.js';
import { FileNotFound, ProcessingFileNotFound } from '#api/core/domain/files/errors.js';
import { search } from '#api/search/index.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';

const TENANT_ID = 'test-tenant';

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const sut = new PostgresFilesDataSource({
    connection: testingPG.config,
    tenantId: TENANT_ID,
    transactionManager,
    fileStorage: FileStorageFactory.default(),
  });
  return { sut, transactionManager };
};

const factory = getFixturesFactory({ convertIdToString: true, tenantId: TENANT_ID });

const fixtures: DBFixture = {
  files: [
    factory.document('update-doc', {
      entity: 'entity1',
      status: 'processing',
    }),
    factory.document('bulk-update-doc', {
      entity: 'entity1',
      status: 'processing',
    }),
    factory.document('replace-doc', {
      entity: 'entity1',
      status: 'ready',
      totalPages: 10,
      language: 'en',
      generatedToc: true,
    }),
    factory.document('delete-doc-1', {
      entity: 'entity1',
      status: 'processing',
    }),
    factory.attachment('delete-doc-2', {
      entity: 'entity1',
      mimetype: 'application/octet-stream',
    }),
    factory.custom_upload('delete-custom', {
      mimetype: 'image/jpeg',
    }),
    factory.document('query-ready-doc', {
      entity: 'query-entity',
      status: 'ready',
      totalPages: 20,
      language: 'es',
      generatedToc: true,
      toc: [{ label: 'Chapter 1', indentation: 0 }],
    }),
    factory.document('query-processing-doc', {
      entity: 'query-entity',
      status: 'processing',
    }),
    factory.document('query-failed-doc', {
      entity: 'query-entity',
      status: 'failed',
    }),
    factory.attachment('query-attachment', {
      entity: 'query-entity',
    }),
    factory.attachment('query-url-attachment', {
      entity: 'query-entity',
      url: 'https://example.com/file.pdf',
    }),
    factory.file('query-thumb', {
      entity: 'query-entity',
      type: 'thumbnail',
      language: 'en',
      mimetype: 'image/jpeg',
    }),
    factory.custom_upload('query-custom'),
    factory.document('coll-doc-ready', {
      entity: 'coll-entity',
      status: 'ready',
      language: 'en',
      totalPages: 3,
      generatedToc: false,
    }),
    factory.document('coll-doc-ready-es', {
      entity: 'coll-entity',
      status: 'ready',
      language: 'es',
      totalPages: 7,
      generatedToc: false,
    }),
    factory.document('coll-doc-processing', {
      entity: 'coll-entity',
      status: 'processing',
    }),
    factory.attachment('coll-attachment', {
      entity: 'coll-entity',
    }),
    factory.file('coll-thumb-en', {
      entity: 'coll-entity',
      type: 'thumbnail',
      language: 'en',
      mimetype: 'image/jpeg',
    }),
    factory.file('coll-thumb-es', {
      entity: 'coll-entity',
      type: 'thumbnail',
      language: 'es',
      mimetype: 'image/jpeg',
    }),
    factory.file('thumb-docid1.jpg', {
      entity: 'entity-docs',
      type: 'thumbnail',
      language: 'en',
      mimetype: 'image/jpeg',
      filename: 'docid1.jpg',
      originalname: 'docid1.jpg',
    }),
    factory.file('thumb-docid2.jpg', {
      entity: 'entity-docs',
      type: 'thumbnail',
      language: 'en',
      mimetype: 'image/jpeg',
      filename: 'docid2.jpg',
      originalname: 'docid2.jpg',
    }),
    factory.document('exist-doc', {
      entity: 'exist-entity',
      status: 'processing',
    }),
    factory.attachment('exist-att', {
      entity: 'exist-entity',
    }),
    factory.document('fulltext-doc', {
      entity: 'ft-entity',
      status: 'ready',
      language: 'en',
      totalPages: 2,
      generatedToc: false,
      fullText: { 1: 'page one', 2: 'page two' },
    }),
  ],
};

describe('PostgresFilesDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingPG.clear(['files']);
    await testingPG.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('create', () => {
    it('should insert a PDF document (status: ready)', async () => {
      const { sut } = createSut();
      const doc = FileBuilder.processedDocument('new-doc', {
        entity: 'entity1',
        language: 'en',
        totalPages: 10,
        generatedToc: true,
      });

      await sut.create(doc);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      const inserted = rows.find(r => r._id === 'new-doc');
      expect(inserted).toMatchObject({
        tenant_id: TENANT_ID,
        type: 'document',
        entity: 'entity1',
        status: 'ready',
        totalPages: 10,
        language: 'eng',
        generatedToc: true,
        mimetype: 'application/pdf',
        size: 1024,
      });
    });

    it('should insert a processing PDF document', async () => {
      const { sut } = createSut();
      const doc = FileBuilder.document('new-doc', {
        entity: 'entity2',
        status: 'processing',
      });

      await sut.create(doc);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      const inserted = rows.find(r => r._id === 'new-doc');
      expect(inserted).toMatchObject({
        type: 'document',
        entity: 'entity2',
        status: 'processing',
        totalPages: null,
        language: null,
      });
    });

    it('should insert an attachment', async () => {
      const { sut } = createSut();
      const attachment = FileBuilder.attachment('new-att', { entity: 'entity1' });

      await sut.create(attachment);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      const inserted = rows.find(r => r._id === 'new-att');
      expect(inserted).toMatchObject({
        type: 'attachment',
        entity: 'entity1',
        url: null,
      });
    });

    it('should insert a URL attachment', async () => {
      const { sut } = createSut();
      const urlAttachment = FileBuilder.urlAttachment('new-url', {
        entity: 'entity1',
        url: 'https://example.com/doc.pdf',
      });

      await sut.create(urlAttachment);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      const inserted = rows.find(r => r._id === 'new-url');
      expect(inserted).toMatchObject({
        type: 'attachment',
        entity: 'entity1',
        url: 'https://example.com/doc.pdf',
      });
    });

    it('should insert a thumbnail', async () => {
      const { sut } = createSut();
      const thumbnail = FileBuilder.thumbnail('new-thumb', {
        entity: 'entity1',
        language: 'es',
      });

      await sut.create(thumbnail);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      const inserted = rows.find(r => r._id === 'new-thumb');
      expect(inserted).toMatchObject({
        type: 'thumbnail',
        entity: 'entity1',
        language: 'spa',
        mimetype: 'image/jpeg',
      });
    });

    it('should insert a custom upload', async () => {
      const { sut } = createSut();
      const custom = FileBuilder.customUpload('new-custom');

      await sut.create(custom);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      const inserted = rows.find(r => r._id === 'new-custom');
      expect(inserted).toMatchObject({
        type: 'custom',
        entity: null,
      });
    });
  });

  describe('bulkCreate', () => {
    it('should insert multiple files of different types', async () => {
      const { sut } = createSut();
      const doc = FileBuilder.processedDocument('bulk-doc', { entity: 'entity-bulk' });
      const attachment = FileBuilder.attachment('bulk-att', { entity: 'entity-bulk' });
      const custom = FileBuilder.customUpload('bulk-custom');

      await sut.bulkCreate([doc, attachment, custom]);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      const insertedIds = rows
        .filter(r => ['bulk-doc', 'bulk-att', 'bulk-custom'].includes(r._id as string))
        .map(r => r._id)
        .sort();
      expect(insertedIds).toEqual(['bulk-att', 'bulk-custom', 'bulk-doc']);
    });
  });

  describe('update', () => {
    it('should update an existing document', async () => {
      const { sut } = createSut();
      const updated = FileBuilder.processedDocument('update-doc', {
        entity: 'entity1',
        language: 'en',
        totalPages: 5,
        status: 'ready',
      });

      await sut.update(updated);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      const row = rows.find(r => r._id === 'update-doc');
      expect(row).toMatchObject({
        status: 'ready',
        totalPages: 5,
        language: 'eng',
      });
    });

    it('should be a no-op when updating a non-existent _id', async () => {
      const { sut } = createSut();
      const doc = FileBuilder.processedDocument('nonexistent', { entity: 'entity1' });

      await sut.update(doc);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      expect(rows.find(r => r._id === 'nonexistent')).toBeUndefined();
    });
  });

  describe('bulkUpdate', () => {
    it('should upsert a mix of existing and new files', async () => {
      const { sut } = createSut();
      const updated = FileBuilder.processedDocument('bulk-update-doc', {
        entity: 'entity1',
        language: 'en',
        totalPages: 3,
        status: 'ready',
      });
      const newDoc = FileBuilder.attachment('new-att', { entity: 'entity2' });

      await sut.bulkUpdate([updated, newDoc]);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      expect(rows.find(r => r._id === 'bulk-update-doc')).toMatchObject({
        status: 'ready',
        totalPages: 3,
      });
      expect(rows.find(r => r._id === 'new-att')).toMatchObject({
        type: 'attachment',
        entity: 'entity2',
      });
    });

    it('should be a no-op with empty array', async () => {
      const { sut } = createSut();
      await sut.bulkUpdate([]);

      const rows = await testingPG.getAllFrom('files');
      expect(rows).toHaveLength(fixtures.files!.length);
    });
  });

  describe('replaceFile', () => {
    it('should replace a document with an attachment (demoteToAttachment pattern)', async () => {
      const { sut } = createSut();
      const attachment = FileBuilder.attachment('replace-doc', { entity: 'entity1' });

      await sut.replaceFile(attachment);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      const row = rows.find(r => r._id === 'replace-doc');
      expect(row).toMatchObject({
        type: 'attachment',
        entity: 'entity1',
        status: null,
        totalPages: null,
        language: null,
        generatedToc: null,
      });
    });
  });

  describe('delete', () => {
    it('should delete files by id', async () => {
      const { sut } = createSut();
      const toDelete = [
        FileBuilder.document('delete-doc-1'),
        FileBuilder.customUpload('delete-custom'),
      ];

      await sut.delete(toDelete);

      const rows = await testingPG.getAllFrom<Record<string, unknown>>('files');
      expect(rows.find(r => r._id === 'delete-doc-1')).toBeUndefined();
      expect(rows.find(r => r._id === 'delete-custom')).toBeUndefined();
      expect(rows.find(r => r._id === 'delete-doc-2')).toBeDefined();
    });

    it('should be a no-op with empty array', async () => {
      const { sut } = createSut();
      await sut.delete([]);

      const rows = await testingPG.getAllFrom('files');
      expect(rows).toHaveLength(fixtures.files!.length);
    });
  });

  describe('reindexing on commit', () => {
    let indexEntitiesSpy: jest.SpyInstance;

    beforeEach(() => {
      indexEntitiesSpy = jest
        .spyOn(search, 'indexEntities')
        .mockImplementation(async () => Promise.resolve());
    });

    afterEach(() => {
      indexEntitiesSpy.mockRestore();
    });

    it('should reindex after create for entity files', async () => {
      const { sut, transactionManager } = createSut();
      const doc = FileBuilder.document('reindex-doc', { entity: 'entity1' });

      await transactionManager.run(async () => {
        await sut.create(doc);
      });

      expect(search.indexEntities).toHaveBeenCalledWith(
        { sharedId: { $in: ['entity1'] } },
        undefined
      );
    });

    it('should reindex with +fullText when a ready PDF is created', async () => {
      const { sut, transactionManager } = createSut();
      const doc = FileBuilder.processedDocument('reindex-doc', { entity: 'entity1' });

      await transactionManager.run(async () => {
        await sut.create(doc);
      });

      expect(search.indexEntities).toHaveBeenCalledWith(
        { sharedId: { $in: ['entity1'] } },
        '+fullText'
      );
    });

    it('should NOT reindex after creating a custom upload (no entity)', async () => {
      const { sut, transactionManager } = createSut();
      const custom = FileBuilder.customUpload('reindex-custom');

      await transactionManager.run(async () => {
        await sut.create(custom);
      });

      expect(search.indexEntities).not.toHaveBeenCalled();
    });

    it('should reindex after update', async () => {
      const { sut, transactionManager } = createSut();
      const original = FileBuilder.document('reindex-doc', {
        entity: 'entity1',
        status: 'processing',
      });

      await transactionManager.run(async () => {
        await sut.create(original);
      });

      const updated = FileBuilder.processedDocument('reindex-doc', {
        entity: 'entity1',
        language: 'en',
        totalPages: 5,
        status: 'ready',
      });

      await transactionManager.run(async () => {
        await sut.update(updated);
      });

      expect(search.indexEntities).toHaveBeenLastCalledWith(
        { sharedId: { $in: ['entity1'] } },
        '+fullText'
      );
    });

    it('should reindex after delete', async () => {
      const { sut, transactionManager } = createSut();
      const doc = FileBuilder.document('reindex-doc', { entity: 'entity1' });

      await transactionManager.run(async () => {
        await sut.create(doc);
      });

      await transactionManager.run(async () => {
        await sut.delete([doc]);
      });

      expect(search.indexEntities).toHaveBeenLastCalledWith(
        { sharedId: { $in: ['entity1'] } },
        undefined
      );
    });

    it('should reindex once for multiple files on same entity', async () => {
      const { sut, transactionManager } = createSut();
      const doc1 = FileBuilder.document('reindex-1', { entity: 'entity1' });
      const doc2 = FileBuilder.attachment('reindex-2', { entity: 'entity1' });

      await transactionManager.run(async () => {
        await sut.create(doc1);
        await sut.create(doc2);
      });

      expect(search.indexEntities).toHaveBeenCalledWith(
        { sharedId: { $in: ['entity1', 'entity1'] } },
        undefined
      );
      expect(search.indexEntities).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('should return a ready PDF document', async () => {
      const { sut } = createSut();
      const result = await sut.getById('query-ready-doc');

      expect(result.isOk()).toBe(true);
      const doc = result.getData() as PDFDocument;
      expect(doc).toBeInstanceOf(PDFDocument);
      expect(doc.id).toBe('query-ready-doc');
      expect(doc.entity).toBe('query-entity');
      expect(doc.status).toBe('ready');
      expect(doc.language).toBe('es');
      expect(doc.totalPages).toBe(20);
      expect(doc.generatedToc).toBe(true);
      expect(doc.toc).toEqual([{ label: 'Chapter 1', indentation: 0 }]);
    });

    it('should return a processing PDF document', async () => {
      const { sut } = createSut();
      const result = await sut.getById('query-processing-doc');

      expect(result.isOk()).toBe(true);
      const doc = result.getData() as PDFDocument;
      expect(doc).toBeInstanceOf(PDFDocument);
      expect(doc.status).toBe('processing');
    });

    it('should return an attachment', async () => {
      const { sut } = createSut();
      const result = await sut.getById('query-attachment');

      expect(result.isOk()).toBe(true);
      expect(result.getData()).toBeInstanceOf(FileAttachment);
    });

    it('should return a URL attachment', async () => {
      const { sut } = createSut();
      const result = await sut.getById('query-url-attachment');

      expect(result.isOk()).toBe(true);
      const att = result.getData() as URLAttachment;
      expect(att).toBeInstanceOf(URLAttachment);
      expect(att.url).toBe('https://example.com/file.pdf');
    });

    it('should return a thumbnail', async () => {
      const { sut } = createSut();
      const result = await sut.getById('query-thumb');

      expect(result.isOk()).toBe(true);
      const thumb = result.getData() as Thumbnail;
      expect(thumb).toBeInstanceOf(Thumbnail);
      expect(thumb.language).toBe('en');
    });

    it('should return a custom upload', async () => {
      const { sut } = createSut();
      const result = await sut.getById('query-custom');

      expect(result.isOk()).toBe(true);
      expect(result.getData()).toBeInstanceOf(CustomUpload);
    });

    it('should return FileNotFound when _id does not exist', async () => {
      const { sut } = createSut();
      const result = await sut.getById('nonexistent');

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileNotFound);
    });

    it('should not return fullText', async () => {
      const { sut } = createSut();
      const result = await sut.getById('fulltext-doc');

      expect(result.isOk()).toBe(true);
      const doc = result.getData() as PDFDocument;
      expect(doc.fullText).toBeUndefined();
    });
  });

  describe('getByIds', () => {
    it('should return array of domain objects for multiple ids', async () => {
      const { sut } = createSut();
      const files = await sut.getByIds(['query-ready-doc', 'query-attachment', 'query-thumb']);

      expect(files).toHaveLength(3);
      const byId = Object.fromEntries(files.map(f => [f.id, f]));
      expect(byId['query-ready-doc']).toBeInstanceOf(PDFDocument);
      expect(byId['query-attachment']).toBeInstanceOf(FileAttachment);
      expect(byId['query-thumb']).toBeInstanceOf(Thumbnail);
    });

    it('should return empty array when no ids match', async () => {
      const { sut } = createSut();
      const files = await sut.getByIds(['nonexistent-1', 'nonexistent-2']);

      expect(files).toEqual([]);
    });

    it('should return only matching files when some ids do not exist', async () => {
      const { sut } = createSut();
      const files = await sut.getByIds(['query-ready-doc', 'nonexistent']);

      expect(files).toHaveLength(1);
      expect(files[0].id).toBe('query-ready-doc');
    });

    it('should not return fullText', async () => {
      const { sut } = createSut();
      const files = await sut.getByIds(['fulltext-doc']);

      expect(files).toHaveLength(1);
      expect((files[0] as PDFDocument).fullText).toBeUndefined();
    });
  });

  describe('getByFilename', () => {
    it('should return file matching filename', async () => {
      const { sut } = createSut();
      const result = await sut.getByFilename('query-processing-doc');

      expect(result.isOk()).toBe(true);
      expect(result.getDataOrThrow().id).toBe('query-processing-doc');
    });

    it('should return FileNotFound when filename does not exist', async () => {
      const { sut } = createSut();
      const result = await sut.getByFilename('nonexistent-file');

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileNotFound);
    });

    it('should filter by allowedTypes', async () => {
      const { sut } = createSut();
      const result = await sut.getByFilename('query-ready-doc', ['attachment']);

      expect(result.isError()).toBe(true);
    });

    it('should return file when type restriction matches', async () => {
      const { sut } = createSut();
      const result = await sut.getByFilename('query-ready-doc', ['document']);

      expect(result.isOk()).toBe(true);
      expect(result.getDataOrThrow().id).toBe('query-ready-doc');
    });

    it('should not return fullText', async () => {
      const { sut } = createSut();
      const result = await sut.getByFilename('fulltext-doc');

      expect(result.isOk()).toBe(true);
      const doc = result.getData() as PDFDocument;
      expect(doc.fullText).toBeUndefined();
    });
  });

  describe('getProcessingById', () => {
    it('should return PDFDocument when status is processing', async () => {
      const { sut } = createSut();
      const result = await sut.getProcessingById('query-processing-doc');

      expect(result.isOk()).toBe(true);
      const doc = result.getDataOrThrow();
      expect(doc).toBeInstanceOf(PDFDocument);
      expect(doc.status).toBe('processing');
    });

    it('should return ProcessingFileNotFound when file is not in processing', async () => {
      const { sut } = createSut();
      const result = await sut.getProcessingById('query-ready-doc');

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(ProcessingFileNotFound);
    });

    it('should return ProcessingFileNotFound when file does not exist', async () => {
      const { sut } = createSut();
      const result = await sut.getProcessingById('nonexistent');

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(ProcessingFileNotFound);
    });
  });

  describe('getAll', () => {
    it('should return all files across all types', async () => {
      const { sut } = createSut();
      const files = await sut.getAll();

      const types = new Set(files.map(f => f.type));
      expect(types.has('document')).toBe(true);
      expect(types.has('attachment')).toBe(true);
      expect(types.has('thumbnail')).toBe(true);
      expect(types.has('custom')).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should not return fullText', async () => {
      const { sut } = createSut();
      const files = await sut.getAll();

      const doc = files.find(f => f.id === 'fulltext-doc') as PDFDocument;
      expect(doc.fullText).toBeUndefined();
    });
  });

  describe('getByEntitiesIds', () => {
    it('should return files for given entities excluding thumbnails', async () => {
      const { sut } = createSut();
      const files = await sut.getByEntitiesIds(['coll-entity']);

      const ids = files.map(f => f.id).sort();
      expect(ids).toEqual([
        'coll-attachment',
        'coll-doc-processing',
        'coll-doc-ready',
        'coll-doc-ready-es',
      ]);
      expect(files.every(f => f.type !== 'thumbnail')).toBe(true);
    });

    it('should return empty array when no entities match', async () => {
      const { sut } = createSut();
      const files = await sut.getByEntitiesIds(['nonexistent-entity']);

      expect(files).toEqual([]);
    });
  });

  describe('getProcessedDocsForEntity', () => {
    it('should return only ready documents for the entity', async () => {
      const { sut } = createSut();
      const docs = await sut.getProcessedDocsForEntity('coll-entity');

      expect(docs).toHaveLength(2);
      expect(docs.every(d => d instanceof PDFDocument)).toBe(true);
      expect(docs.every(d => d.status === 'ready')).toBe(true);
    });

    it('should filter by language', async () => {
      const { sut } = createSut();
      const docs = await sut.getProcessedDocsForEntity('coll-entity', { languages: ['en'] });

      expect(docs).toHaveLength(1);
      expect(docs[0].language).toBe('en');
    });

    it('should filter by multiple languages', async () => {
      const { sut } = createSut();
      const docs = await sut.getProcessedDocsForEntity('coll-entity', { languages: ['en', 'es'] });

      expect(docs).toHaveLength(2);
    });

    it('should return empty for entity with no ready documents', async () => {
      const { sut } = createSut();
      const docs = await sut.getProcessedDocsForEntity('nonexistent');

      expect(docs).toEqual([]);
    });

    it('should not return fullText', async () => {
      const { sut } = createSut();
      const docs = await sut.getProcessedDocsForEntity('ft-entity');

      expect(docs).toHaveLength(1);
      expect(docs[0].fullText).toBeUndefined();
    });
  });

  describe('getThumbnails', () => {
    it('should return thumbnails for given entities', async () => {
      const { sut } = createSut();
      const thumbnails = await sut.getThumbnails(['coll-entity']);

      expect(thumbnails).toHaveLength(2);
      expect(thumbnails.every(t => t instanceof Thumbnail)).toBe(true);
      expect(thumbnails.every(t => t.type === 'thumbnail')).toBe(true);
    });

    it('should return empty for entity without thumbnails', async () => {
      const { sut } = createSut();
      const thumbnails = await sut.getThumbnails(['nonexistent']);

      expect(thumbnails).toEqual([]);
    });
  });

  describe('getThumbnailsByLanguage', () => {
    it('should return thumbnails matching the language', async () => {
      const { sut } = createSut();
      const thumbnails = await sut.getThumbnailsByLanguage('en');

      expect(thumbnails.length).toBeGreaterThan(0);
      expect(thumbnails.every(t => t.language === 'en')).toBe(true);
    });

    it('should return empty for unmatched language', async () => {
      const { sut } = createSut();
      const thumbnails = await sut.getThumbnailsByLanguage('fr');

      expect(thumbnails).toEqual([]);
    });
  });

  describe('getThumbnailsForProcessedPDFs', () => {
    it('should return thumbnails whose filename matches docId.jpg', async () => {
      const { sut } = createSut();
      const thumbnails = await sut.getThumbnailsForProcessedPDFs(['docid1']);

      expect(thumbnails).toHaveLength(1);
      expect(thumbnails[0].filename).toBe('docid1.jpg');
    });

    it('should return thumbnails for multiple doc ids', async () => {
      const { sut } = createSut();
      const thumbnails = await sut.getThumbnailsForProcessedPDFs(['docid1', 'docid2']);

      expect(thumbnails).toHaveLength(2);
      const filenames = thumbnails.map(t => t.filename).sort();
      expect(filenames).toEqual(['docid1.jpg', 'docid2.jpg']);
    });

    it('should return empty when no doc ids match', async () => {
      const { sut } = createSut();
      const thumbnails = await sut.getThumbnailsForProcessedPDFs(['nonexistent']);

      expect(thumbnails).toEqual([]);
    });
  });

  describe('filesExistForEntities', () => {
    it('should return true when all files exist with correct entity', async () => {
      const { sut } = createSut();
      const result = await sut.filesExistForEntities([
        { _id: 'exist-doc', entity: 'exist-entity' },
        { _id: 'exist-att', entity: 'exist-entity' },
      ]);

      expect(result).toBe(true);
    });

    it('should return false when any file is missing', async () => {
      const { sut } = createSut();
      const result = await sut.filesExistForEntities([
        { _id: 'exist-doc', entity: 'exist-entity' },
        { _id: 'nonexistent', entity: 'exist-entity' },
      ]);

      expect(result).toBe(false);
    });

    it('should return false when file exists but entity does not match', async () => {
      const { sut } = createSut();
      const result = await sut.filesExistForEntities([
        { _id: 'exist-doc', entity: 'wrong-entity' },
      ]);

      expect(result).toBe(false);
    });
  });
});
