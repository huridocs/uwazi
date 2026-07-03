/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { PostgresFilesDAO } from '../PostgresFilesDAO.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';

const TENANT_ID = 'test-tenant';

const factory = getFixturesFactory({ convertIdToString: true, tenantId: TENANT_ID });

const baseFixtures = {
  files: [
    factory.document('doc_with_fulltext', {
      entity: 'entity_1',
      status: 'ready',
      fullText: { 1: 'page one content' },
    }),
    factory.attachment('att_1', { entity: 'entity_1' }),
    factory.custom_upload('custom_1', {}),
    factory.document('doc_no_fulltext', {
      entity: 'entity_2',
      status: 'ready',
    }),
    factory.document('doc_entity_a_1', {
      entity: 'entity_a',
      status: 'ready',
    }),
    factory.document('doc_entity_a_2', {
      entity: 'entity_a',
      status: 'ready',
    }),
    factory.attachment('att_entity_a', {
      entity: 'entity_a',
    }),
    factory.file('thumb_entity_a', {
      entity: 'entity_a',
      type: 'thumbnail',
      language: 'en',
      mimetype: 'image/jpeg',
    }),
    factory.document('doc_x_en', {
      entity: 'entity_x',
      language: 'en',
      status: 'ready',
    }),
    factory.document('doc_x_es', {
      entity: 'entity_x',
      language: 'es',
      status: 'ready',
    }),
    factory.attachment('att_x_en', {
      entity: 'entity_x',
      language: 'en',
    }),
    factory.document('doc_y_en', {
      entity: 'entity_y',
      language: 'en',
      status: 'ready',
    }),
    factory.document('doc_z_es', {
      entity: 'entity_z',
      language: 'es',
      status: 'ready',
    }),
  ],
};

const createSut = () =>
  new PostgresFilesDAO({
    tenantId: TENANT_ID,
  });

describe('PostgresFilesDAO', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(baseFixtures);
  });

  describe('getById()', () => {
    it('returns Result.ok with the file row when found', async () => {
      const dao = createSut();
      const result = await dao.getById(factory.idString('doc_with_fulltext'));

      expect(result.isOk()).toBe(true);
      expect(result.getDataOrThrow()).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });

    it('includes fullText when withFullText is true', async () => {
      const dao = createSut();
      const result = await dao.getById(factory.idString('doc_with_fulltext'), {
        withFullText: true,
      });

      expect(result.isOk()).toBe(true);
      const row = result.getDataOrThrow();
      expect(row.fullText).toEqual({ 1: 'page one content' });
      expect(row).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
        status: 'ready',
      });
    });

    it('excludes fullText field by default', async () => {
      const dao = createSut();
      const result = await dao.getById(factory.idString('doc_with_fulltext'));

      expect(result.isOk()).toBe(true);
      const row = result.getDataOrThrow();
      expect(row).not.toHaveProperty('fullText');
      expect(row).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });

    it('excludes fullText when projection explicitly excludes it', async () => {
      const dao = createSut();
      const result = await dao.getById(factory.idString('doc_with_fulltext'), {
        projection: { fullText: 0 },
      });

      expect(result.isOk()).toBe(true);
      const row = result.getDataOrThrow();
      expect(row).not.toHaveProperty('fullText');
      expect(row).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });

    it('explicit projection takes precedence over withFullText', async () => {
      const dao = createSut();
      const result = await dao.getById(factory.idString('doc_with_fulltext'), {
        withFullText: true,
        projection: { fullText: 0 },
      });

      expect(result.isOk()).toBe(true);
      expect(result.getDataOrThrow()).not.toHaveProperty('fullText');
    });

    it('returns Result.fail with FileNotFound when id does not exist', async () => {
      const dao = createSut();
      const result = await dao.getById('000000000000000000000000');

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileNotFound);
    });

    it('returns FileNotFound when id format is valid but no document matches', async () => {
      const dao = createSut();
      const result = await dao.getById('507f1f77bcf86cd799439011');

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileNotFound);
    });

    it('works for document, attachment, and custom file types', async () => {
      const dao = createSut();

      const docResult = await dao.getById(factory.idString('doc_with_fulltext'));
      expect(docResult.getDataOrThrow().type).toBe('document');

      const attResult = await dao.getById(factory.idString('att_1'));
      expect(attResult.getDataOrThrow().type).toBe('attachment');

      const customResult = await dao.getById(factory.idString('custom_1'));
      expect(customResult.getDataOrThrow().type).toBe('custom');
    });
  });

  describe('getByFilename()', () => {
    it('returns Result.ok with the file row when filename matches', async () => {
      const dao = createSut();
      const result = await dao.getByFilename('doc_with_fulltext');

      expect(result.isOk()).toBe(true);
      expect(result.getDataOrThrow()).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });

    it('excludes fullText by default', async () => {
      const dao = createSut();
      const result = await dao.getByFilename('doc_with_fulltext');

      expect(result.isOk()).toBe(true);
      const row = result.getDataOrThrow();
      expect(row).not.toHaveProperty('fullText');
      expect(row).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });

    it('includes fullText when withFullText is true', async () => {
      const dao = createSut();
      const result = await dao.getByFilename('doc_with_fulltext', {
        withFullText: true,
      });

      expect(result.isOk()).toBe(true);
      const row = result.getDataOrThrow();
      expect(row.fullText).toEqual({ 1: 'page one content' });
      expect(row).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
        status: 'ready',
      });
    });

    it('returns Result.fail with FileNotFound when filename does not exist', async () => {
      const dao = createSut();
      const result = await dao.getByFilename('nonexistent_file');

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileNotFound);
    });

    it('returns the correct file type per fixture', async () => {
      const dao = createSut();

      const docResult = await dao.getByFilename('doc_with_fulltext');
      expect(docResult.getDataOrThrow().type).toBe('document');

      const attResult = await dao.getByFilename('att_1');
      expect(attResult.getDataOrThrow().type).toBe('attachment');

      const customResult = await dao.getByFilename('custom_1');
      expect(customResult.getDataOrThrow().type).toBe('custom');
    });
  });

  describe('getByEntity()', () => {
    it('returns all files for the entity when no types filter', async () => {
      const dao = createSut();
      const files = await dao.getByEntity('entity_a');

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
      const dao = createSut();
      const files = await dao.getByEntity('entity_a', { types: ['document'] });

      expect(files).toHaveLength(2);
      expect(files.every(f => f.type === 'document')).toBe(true);
    });

    it('returns only files matching multiple types', async () => {
      const dao = createSut();
      const files = await dao.getByEntity('entity_a', {
        types: ['document', 'attachment'],
      });

      expect(files).toHaveLength(3);
      expect(files.every(f => ['document', 'attachment'].includes(f.type))).toBe(true);
    });

    it('returns empty array when entity has no files', async () => {
      const dao = createSut();
      const files = await dao.getByEntity('nonexistent_entity');

      expect(files).toEqual([]);
    });

    it('applies projection when options.projection is provided', async () => {
      const dao = createSut();
      const files = await dao.getByEntity('entity_a', {
        projection: { filename: 1, type: 1 },
      });

      expect(files.length).toBeGreaterThan(0);
      files.forEach(file => {
        expect(file).toHaveProperty('filename');
        expect(file).toHaveProperty('type');
      });
    });

    it('includes thumbnails', async () => {
      const dao = createSut();
      const files = await dao.getByEntity('entity_a');
      const thumbnails = files.filter(f => f.type === 'thumbnail');

      expect(thumbnails).toHaveLength(1);
    });

    it('excludes fullText by default', async () => {
      const dao = createSut();
      const files = await dao.getByEntity('entity_1');
      const docWithFullText = files.find(f => f.filename === 'doc_with_fulltext');

      expect(docWithFullText).toBeDefined();
      expect(docWithFullText).not.toHaveProperty('fullText');
      expect(docWithFullText).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });
  });

  describe('getByEntitySharedIds()', () => {
    it('returns all files for given sharedIds with no options', async () => {
      const dao = createSut();
      const files = await dao.getByEntitySharedIds(['entity_x', 'entity_y']);

      expect(files).toHaveLength(4);
      const filenames = files.map(f => f.filename);
      expect(filenames).toEqual(
        expect.arrayContaining(['doc_x_en', 'doc_x_es', 'att_x_en', 'doc_y_en'])
      );
    });

    it('returns files for a subset of sharedIds', async () => {
      const dao = createSut();
      const files = await dao.getByEntitySharedIds(['entity_y']);

      expect(files).toHaveLength(1);
      expect(files[0].filename).toBe('doc_y_en');
    });

    it('returns files filtered by language', async () => {
      const dao = createSut();
      const files = await dao.getByEntitySharedIds(['entity_x'], {
        languages: ['eng'],
      });

      expect(files).toHaveLength(2);
      expect(files.every(f => f.language === 'eng')).toBe(true);
    });

    it('returns files filtered by type', async () => {
      const dao = createSut();
      const files = await dao.getByEntitySharedIds(['entity_x'], {
        types: ['document'],
      });

      expect(files).toHaveLength(2);
      expect(files.every(f => f.type === 'document')).toBe(true);
    });

    it('combines languages and type filters', async () => {
      const dao = createSut();
      const files = await dao.getByEntitySharedIds(['entity_x'], {
        languages: ['eng'],
        types: ['document'],
      });

      expect(files).toHaveLength(1);
      expect(files[0].filename).toBe('doc_x_en');
    });

    it('excludes fullText by default', async () => {
      const dao = createSut();
      const files = await dao.getByEntitySharedIds(['entity_1']);

      expect(files.length).toBeGreaterThan(0);
      files.forEach(file => {
        expect(file).not.toHaveProperty('fullText');
      });
      const docWithFullText = files.find(f => f.filename === 'doc_with_fulltext');
      expect(docWithFullText).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });

    it('includes fullText when withFullText is true', async () => {
      const dao = createSut();
      const files = await dao.getByEntitySharedIds(['entity_1'], {
        withFullText: true,
      });

      const docWithFullText = files.find(f => f.filename === 'doc_with_fulltext');
      expect(docWithFullText?.fullText).toEqual({ 1: 'page one content' });
      expect(docWithFullText).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });

    it('returns empty array when no sharedIds match', async () => {
      const dao = createSut();
      const files = await dao.getByEntitySharedIds(['nonexistent_id']);

      expect(files).toEqual([]);
    });
  });

  describe('getDistinctEntitySharedIds()', () => {
    it('returns distinct entity sharedIds filtered by type, status, and language', async () => {
      const dao = createSut();
      const result = await dao.getDistinctEntitySharedIds({
        type: 'document',
        status: 'ready',
        language: 'eng',
      });
      expect(result.sort()).toEqual(['entity_x', 'entity_y']);
    });

    it('filters by type only', async () => {
      const dao = createSut();
      const result = await dao.getDistinctEntitySharedIds({ type: 'attachment' });
      expect(result.sort()).toEqual(['entity_1', 'entity_a', 'entity_x']);
    });

    it('filters by status only', async () => {
      const dao = createSut();
      const result = await dao.getDistinctEntitySharedIds({ status: 'ready' });
      expect(result.sort()).toEqual([
        'entity_1',
        'entity_2',
        'entity_a',
        'entity_x',
        'entity_y',
        'entity_z',
      ]);
    });

    it('filters by language only', async () => {
      const dao = createSut();
      const result = await dao.getDistinctEntitySharedIds({ language: 'eng' });
      expect(result.sort()).toEqual(['entity_a', 'entity_x', 'entity_y']);
    });

    it('returns empty array when no files match', async () => {
      const dao = createSut();
      const result = await dao.getDistinctEntitySharedIds({
        type: 'document',
        status: 'ready',
        language: 'xx' as any,
      });
      expect(result).toEqual([]);
    });

    it('excludes files with null entity', async () => {
      await testingEnvironment.setFixtures({
        files: [
          factory.document('doc_has_entity', {
            entity: 'entity_valid',
            type: 'document',
            status: 'ready',
          }),
          factory.document('doc_no_entity', {
            type: 'document',
            status: 'ready',
            entity: null as any,
          }),
        ],
      });
      const dao = createSut();
      const result = await dao.getDistinctEntitySharedIds({
        type: 'document',
        status: 'ready',
      });
      expect(result).toEqual(['entity_valid']);
    });
  });

  describe('countDocuments()', () => {
    it('returns the total number of files', async () => {
      const dao = createSut();
      const count = await dao.countDocuments();
      expect(count).toBe(13);
    });

    describe('when collection is empty', () => {
      beforeEach(async () => {
        await testingEnvironment.setFixtures({ files: [] });
      });

      it('returns 0', async () => {
        const dao = createSut();
        const count = await dao.countDocuments();
        expect(count).toBe(0);
      });
    });
  });

  describe('getTotalFileSize()', () => {
    it('returns the sum of all file sizes', async () => {
      const dao = createSut();
      const totalSize = await dao.getTotalFileSize();
      expect(totalSize).toBe(13312);
    });

    describe('when collection is empty', () => {
      beforeEach(async () => {
        await testingEnvironment.setFixtures({ files: [] });
      });

      it('returns 0', async () => {
        const dao = createSut();
        const totalSize = await dao.getTotalFileSize();
        expect(totalSize).toBe(0);
      });
    });
  });

  describe('getByQuery()', () => {
    it('excludes fullText by default', async () => {
      const dao = createSut();
      const files = await dao.getByQuery({ filename: 'doc_with_fulltext' });

      expect(files).toHaveLength(1);
      expect(files[0]).not.toHaveProperty('fullText');
      expect(files[0]).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
      });
    });

    it('returns matching files for a simple equality query', async () => {
      const dao = createSut();
      const files = await dao.getByQuery({ type: 'attachment' });

      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files.every(f => f.type === 'attachment')).toBe(true);
    });

    it('returns matching files for a $in query', async () => {
      const dao = createSut();
      const files = await dao.getByQuery({
        entity: { $in: ['entity_a', 'entity_x'] },
      });

      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files.every(f => ['entity_a', 'entity_x'].includes(f.entity!))).toBe(true);
    });

    it('returns empty array when query matches nothing', async () => {
      const dao = createSut();
      const files = await dao.getByQuery({ filename: 'nonexistent_file' });

      expect(files).toEqual([]);
    });

    it('applies projection when provided', async () => {
      const dao = createSut();
      const files = await dao.getByQuery({ type: 'document' }, { projection: { filename: 1 } });

      expect(files.length).toBeGreaterThan(0);
      files.forEach(file => {
        expect(file).toHaveProperty('filename');
      });
    });

    it('applies sort when provided', async () => {
      const dao = createSut();
      const files = await dao.getByQuery({ type: 'document' }, { sort: { _id: -1 } });

      expect(files.length).toBeGreaterThan(1);
      for (let i = 1; i < files.length; i += 1) {
        expect(files[i - 1]._id >= files[i]._id).toBe(true);
      }
    });

    it('includes fullText when withFullText is true', async () => {
      const dao = createSut();
      const files = await dao.getByQuery({ filename: 'doc_with_fulltext' }, { withFullText: true });

      expect(files).toHaveLength(1);
      expect(files[0].fullText).toEqual({ 1: 'page one content' });
      expect(files[0]).toMatchObject({
        filename: 'doc_with_fulltext',
        entity: 'entity_1',
        type: 'document',
        status: 'ready',
      });
    });

    it('applies limit when provided', async () => {
      const dao = createSut();
      const files = await dao.getByQuery({ type: 'document' }, { limit: 2 });

      expect(files).toHaveLength(2);
    });
  });

  describe('getNextDocumentWithoutToc()', () => {
    it('returns a document with a filename and no toc', async () => {
      const dao = createSut();
      const result = await dao.getNextDocumentWithoutToc();

      expect(result.isOk()).toBe(true);
      const file = result.getDataOrThrow();
      expect(file.type).toBe('document');
      expect(file.filename).toBeTruthy();
      expect(file.toc).toBeNull();
    });

    describe('when all documents have a toc', () => {
      beforeEach(async () => {
        await testingEnvironment.setFixtures({
          files: [
            factory.document('doc_toc_1', {
              entity: 'e1',
              status: 'ready',
              toc: [{ label: 'Intro' }],
            }),
            factory.document('doc_toc_2', {
              entity: 'e2',
              status: 'ready',
              toc: [{ label: 'Chapter 1' }],
            }),
          ],
        });
      });

      it('returns Result.fail with FileNotFound', async () => {
        const dao = createSut();
        const result = await dao.getNextDocumentWithoutToc();

        expect(result.isError()).toBe(true);
        expect(result.getError()).toBeInstanceOf(FileNotFound);
      });
    });

    describe('when no documents exist', () => {
      beforeEach(async () => {
        await testingEnvironment.setFixtures({ files: [] });
      });

      it('returns Result.fail with FileNotFound', async () => {
        const dao = createSut();
        const result = await dao.getNextDocumentWithoutToc();

        expect(result.isError()).toBe(true);
        expect(result.getError()).toBeInstanceOf(FileNotFound);
      });
    });

    describe('tenant isolation', () => {
      beforeEach(async () => {
        const tenantDoc = factory.document('no_toc_tenant', {
          entity: 'e_tenant',
          status: 'ready',
        });
        const otherDoc = factory.document('no_toc_other', {
          entity: 'e_other',
          status: 'ready',
        });

        await testingEnvironment.setFixtures({
          files: [tenantDoc, { ...otherDoc, tenant_id: 'other-tenant' } as any],
        });
      });

      it('returns only the current tenant document', async () => {
        const dao = createSut();
        const result = await dao.getNextDocumentWithoutToc();

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).toMatchObject({
          filename: 'no_toc_tenant',
          entity: 'e_tenant',
        });
      });
    });
  });
});
