import { ObjectId } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { MongoFilesDAO } from '../MongoFilesDAO.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  files: [
    factory.document('doc_with_fulltext', {
      entity: 'entity_1',
      type: 'document',
      status: 'ready',
      fullText: { 1: 'page one content' },
    }),
    factory.attachment('att_1', { entity: 'entity_1' }),
    factory.custom_upload('custom_1'),
    factory.document('doc_no_fulltext', {
      entity: 'entity_2',
      type: 'document',
      status: 'ready',
    }),
    // getByEntity fixtures: entity_a has multiple files of different types
    factory.document('doc_entity_a_1', {
      entity: 'entity_a',
      type: 'document',
      status: 'ready',
    }),
    factory.document('doc_entity_a_2', {
      entity: 'entity_a',
      type: 'document',
      status: 'ready',
    }),
    factory.attachment('att_entity_a', {
      entity: 'entity_a',
    }),
    factory.file('thumb_entity_a', {
      entity: 'entity_a',
      type: 'thumbnail',
    }),
    // getByEntitySharedIds fixtures: entities with languages
    factory.document('doc_x_en', {
      entity: 'entity_x',
      type: 'document',
      language: 'en',
      status: 'ready',
    }),
    factory.document('doc_x_es', {
      entity: 'entity_x',
      type: 'document',
      language: 'es',
      status: 'ready',
    }),
    factory.attachment('att_x_en', {
      entity: 'entity_x',
      language: 'en',
    }),
    factory.document('doc_y_en', {
      entity: 'entity_y',
      type: 'document',
      language: 'en',
      status: 'ready',
    }),
    factory.document('doc_z_es', {
      entity: 'entity_z',
      type: 'document',
      language: 'es',
      status: 'ready',
    }),
  ],
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  return new MongoFilesDAO({ db: getConnection(), transactionManager });
};

describe('MongoFilesDAO', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getById()', () => {
    it('returns Result.ok with the file DBO when found', async () => {
      const sut = createSut();
      const result = await sut.getById(factory.id('doc_with_fulltext').toString());
      expect(result.isOk()).toBe(true);
      expect(result.getDataOrThrow()).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });

    it('includes fullText when withFullText is true', async () => {
      const sut = createSut();
      const result = await sut.getById(factory.id('doc_with_fulltext').toString(), {
        withFullText: true,
      });
      expect(result.isOk()).toBe(true);
      expect(result.getDataOrThrow().fullText).toEqual({ 1: 'page one content' });
    });

    it('excludes fullText field by default', async () => {
      const sut = createSut();
      const result = await sut.getById(factory.id('doc_with_fulltext').toString());
      expect(result.isOk()).toBe(true);
      expect(result.getDataOrThrow()).not.toHaveProperty('fullText');
    });

    it('excludes fullText when withFullText is false', async () => {
      const sut = createSut();
      const result = await sut.getById(factory.id('doc_with_fulltext').toString(), {
        withFullText: false,
      });
      expect(result.isOk()).toBe(true);
      expect(result.getDataOrThrow()).not.toHaveProperty('fullText');
    });

    it('returns Result.fail with FileNotFound when id does not exist', async () => {
      const sut = createSut();
      const result = await sut.getById(new ObjectId().toString());
      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileNotFound);
    });

    it('returns Result.fail with FileNotFound when id is a valid format but no document matches', async () => {
      const sut = createSut();
      const result = await sut.getById('507f1f77bcf86cd799439011');
      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileNotFound);
    });

    it('works for any file type (document, attachment, custom)', async () => {
      const sut = createSut();
      const docResult = await sut.getById(factory.id('doc_with_fulltext').toString());
      expect(docResult.getDataOrThrow().type).toBe('document');

      const attResult = await sut.getById(factory.id('att_1').toString());
      expect(attResult.getDataOrThrow().type).toBe('attachment');

      const customResult = await sut.getById(factory.id('custom_1').toString());
      expect(customResult.getDataOrThrow().type).toBe('custom');
    });
  });

  describe('getByFilename()', () => {
    it('returns Result.ok with the file DBO when filename matches', async () => {
      const sut = createSut();
      const result = await sut.getByFilename('doc_with_fulltext');
      expect(result.isOk()).toBe(true);
      expect(result.getDataOrThrow()).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });

    it('returns Result.fail with FileNotFound when filename does not exist', async () => {
      const sut = createSut();
      const result = await sut.getByFilename('nonexistent_file');
      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileNotFound);
    });

    it('returns the correct file type matching the fixture', async () => {
      const sut = createSut();
      const docResult = await sut.getByFilename('doc_with_fulltext');
      expect(docResult.getDataOrThrow().type).toBe('document');

      const attResult = await sut.getByFilename('att_1');
      expect(attResult.getDataOrThrow().type).toBe('attachment');

      const customResult = await sut.getByFilename('custom_1');
      expect(customResult.getDataOrThrow().type).toBe('custom');
    });
  });

  describe('getByEntity()', () => {
    it('returns all files for the entity when no types filter', async () => {
      const sut = createSut();
      const files = await sut.getByEntity('entity_a');
      expect(files).toHaveLength(4);
      expect(files.map(f => f.filename)).toEqual(
        expect.arrayContaining([
          'doc_entity_a_1',
          'doc_entity_a_2',
          'att_entity_a',
          'thumb_entity_a',
        ])
      );
    });

    it('returns only files matching given types', async () => {
      const sut = createSut();
      const files = await sut.getByEntity('entity_a', { types: ['document'] });
      expect(files).toHaveLength(2);
      expect(files.every(f => f.type === 'document')).toBe(true);
    });

    it('returns only files matching multiple types', async () => {
      const sut = createSut();
      const files = await sut.getByEntity('entity_a', { types: ['document', 'attachment'] });
      expect(files).toHaveLength(3);
      expect(files.every(f => ['document', 'attachment'].includes(f.type))).toBe(true);
    });

    it('returns empty array when entity has no files', async () => {
      const sut = createSut();
      const files = await sut.getByEntity('nonexistent_entity');
      expect(files).toEqual([]);
    });

    it('applies projection when options.projection is provided', async () => {
      const sut = createSut();
      const files = await sut.getByEntity('entity_a', { projection: { filename: 1, type: 1 } });
      expect(files.length).toBeGreaterThan(0);
      files.forEach(file => {
        expect(file).toHaveProperty('filename');
        expect(file).toHaveProperty('type');
      });
    });

    it('includes thumbnails (no type exclusion — mirrors files.get behavior)', async () => {
      const sut = createSut();
      const files = await sut.getByEntity('entity_a');
      const thumbnails = files.filter(f => f.type === 'thumbnail');
      expect(thumbnails).toHaveLength(1);
    });
  });

  describe('getByEntitySharedIds()', () => {
    it('returns all files for given sharedIds with no options', async () => {
      const sut = createSut();
      const files = await sut.getByEntitySharedIds(['entity_x', 'entity_y']);
      expect(files).toHaveLength(4);
      const filenames = files.map(f => f.filename);
      expect(filenames).toEqual(
        expect.arrayContaining(['doc_x_en', 'doc_x_es', 'att_x_en', 'doc_y_en'])
      );
    });

    it('returns files for a subset of sharedIds', async () => {
      const sut = createSut();
      const files = await sut.getByEntitySharedIds(['entity_y']);
      expect(files).toHaveLength(1);
      expect(files[0].filename).toBe('doc_y_en');
    });

    it('returns files filtered by language', async () => {
      const sut = createSut();
      const files = await sut.getByEntitySharedIds(['entity_x'], { languages: ['eng'] });
      expect(files).toHaveLength(2);
      expect(files.every(f => f.language === 'eng')).toBe(true);
    });

    it('returns files filtered by type', async () => {
      const sut = createSut();
      const files = await sut.getByEntitySharedIds(['entity_x'], { type: 'document' });
      expect(files).toHaveLength(2);
      expect(files.every(f => f.type === 'document')).toBe(true);
    });

    it('combines languages and type filters', async () => {
      const sut = createSut();
      const files = await sut.getByEntitySharedIds(['entity_x'], {
        languages: ['eng'],
        type: 'document',
      });
      expect(files).toHaveLength(1);
      expect(files[0].filename).toBe('doc_x_en');
    });

    it('excludes fullText by default', async () => {
      const sut = createSut();
      const files = await sut.getByEntitySharedIds(['entity_1']);
      expect(files.length).toBeGreaterThan(0);
      files.forEach(file => {
        expect(file).not.toHaveProperty('fullText');
      });
    });

    it('includes fullText when includeFullText is true', async () => {
      const sut = createSut();
      const files = await sut.getByEntitySharedIds(['entity_1'], { includeFullText: true });
      const docWithFullText = files.find(f => f.filename === 'doc_with_fulltext');
      expect(docWithFullText?.fullText).toEqual({ 1: 'page one content' });
    });

    it('returns empty array when no sharedIds match', async () => {
      const sut = createSut();
      const files = await sut.getByEntitySharedIds(['nonexistent_id']);
      expect(files).toEqual([]);
    });
  });

  describe('getByQuery()', () => {
    it('returns matching files for a simple equality query', async () => {
      const sut = createSut();
      const files = await sut.getByQuery({ type: 'attachment' });
      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files.every(f => f.type === 'attachment')).toBe(true);
    });

    it('returns matching files for a $in query', async () => {
      const sut = createSut();
      const files = await sut.getByQuery({ entity: { $in: ['entity_a', 'entity_x'] } });
      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files.every(f => ['entity_a', 'entity_x'].includes(f.entity))).toBe(true);
    });

    it('returns empty array when query matches nothing', async () => {
      const sut = createSut();
      const files = await sut.getByQuery({ filename: 'nonexistent_file' });
      expect(files).toEqual([]);
    });

    it('applies projection when provided', async () => {
      const sut = createSut();
      const files = await sut.getByQuery({ type: 'document' }, { projection: { filename: 1 } });
      expect(files.length).toBeGreaterThan(0);
      files.forEach(file => {
        expect(file).toHaveProperty('filename');
        expect(file).not.toHaveProperty('fullText');
      });
    });

    it('applies sort when provided', async () => {
      const sut = createSut();
      const files = await sut.getByQuery(
        { type: 'document' },
        { sort: { _id: -1 }, projection: { _id: 1 } }
      );
      expect(files.length).toBeGreaterThan(1);
      for (let i = 1; i < files.length; i++) {
        expect(files[i - 1]._id.toString() >= files[i]._id.toString()).toBe(true);
      }
    });

    it('applies limit when provided', async () => {
      const sut = createSut();
      const files = await sut.getByQuery({ type: 'document' }, { limit: 2 });
      expect(files).toHaveLength(2);
    });
  });

  describe('getNextDocumentWithoutToc()', () => {
    it('returns a document of type document with a filename and no toc', async () => {
      const sut = createSut();
      const result = await sut.getNextDocumentWithoutToc();
      expect(result.isOk()).toBe(true);
      const file = result.getDataOrThrow();
      expect(file.type).toBe('document');
      expect(file).toHaveProperty('filename');
      expect(file).not.toHaveProperty('toc');
    });

    describe('when all documents have a toc', () => {
      beforeAll(async () => {
        await testingEnvironment.setUp({
          files: [
            factory.document('doc_toc_1', {
              entity: 'e1',
              status: 'ready',
              toc: [{ heading: 'Intro' }],
            }),
            factory.document('doc_toc_2', {
              entity: 'e2',
              status: 'ready',
              toc: [{ heading: 'Chapter 1' }],
            }),
          ],
        });
      });

      it('returns Result.fail with FileNotFound', async () => {
        const sut = createSut();
        const result = await sut.getNextDocumentWithoutToc();
        expect(result.isError()).toBe(true);
        expect(result.getError()).toBeInstanceOf(FileNotFound);
      });
    });

    describe('when no documents exist', () => {
      beforeAll(async () => {
        await testingEnvironment.setUp({ files: [] });
      });

      it('returns Result.fail with FileNotFound', async () => {
        const sut = createSut();
        const result = await sut.getNextDocumentWithoutToc();
        expect(result.isError()).toBe(true);
        expect(result.getError()).toBeInstanceOf(FileNotFound);
      });
    });
  });

  describe('FilesDAOFactory', () => {
    it('returns a MongoFilesDAO instance when called inside runWithContext', async () => {
      await testingEnvironment.runWithContext(async () => {
        const dao = FilesDAOFactory.default();
        expect(dao).toBeInstanceOf(MongoFilesDAO);
      });
    });
  });
});
