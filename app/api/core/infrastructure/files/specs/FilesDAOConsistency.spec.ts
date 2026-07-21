/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  files: [
    // ── Single-file lookups ──
    f.document('doc_with_fulltext', {
      entity: 'entity_1',
      status: 'ready',
      language: 'en',
      fullText: { 1: 'page one content' },
      mimetype: 'application/pdf',
      size: 100,
    }),
    f.document('doc_no_fulltext', {
      entity: 'entity_2',
      status: 'ready',
      mimetype: 'application/pdf',
      size: 100,
    }),
    f.attachment('att_1', { entity: 'entity_1', mimetype: 'application/pdf', size: 100 }),
    f.custom_upload('custom_1', { mimetype: 'application/octet-stream', size: 100 }),
    f.file('thumb_1', {
      entity: 'entity_1',
      type: 'thumbnail',
      language: 'en',
      mimetype: 'image/jpeg',
      size: 100,
    }),

    // ── getByEntity ──
    f.document('doc_a_1', {
      entity: 'entity_a',
      status: 'ready',
      mimetype: 'application/pdf',
      size: 100,
    }),
    f.document('doc_a_2', {
      entity: 'entity_a',
      status: 'ready',
      mimetype: 'application/pdf',
      size: 100,
    }),
    f.attachment('att_a', { entity: 'entity_a', mimetype: 'application/pdf', size: 100 }),
    f.file('thumb_a', {
      entity: 'entity_a',
      type: 'thumbnail',
      language: 'en',
      mimetype: 'image/jpeg',
      size: 100,
    }),

    // ── getByEntitySharedIds ──
    f.document('doc_x_en', {
      entity: 'entity_x',
      status: 'ready',
      language: 'en',
      mimetype: 'application/pdf',
      size: 100,
    }),
    f.document('doc_x_es', {
      entity: 'entity_x',
      status: 'ready',
      language: 'es',
      mimetype: 'application/pdf',
      size: 100,
    }),
    f.attachment('att_x_en', {
      entity: 'entity_x',
      language: 'en',
      mimetype: 'application/pdf',
      size: 100,
    }),
    f.document('doc_y_en', {
      entity: 'entity_y',
      status: 'ready',
      language: 'en',
      mimetype: 'application/pdf',
      size: 100,
    }),

    // ── getNextDocumentWithoutToc ──
    f.document('doc_no_toc', {
      entity: 'entity_3',
      status: 'ready',
      mimetype: 'application/pdf',
      size: 100,
    }),
    f.document('doc_with_toc', {
      entity: 'entity_4',
      status: 'ready',
      toc: [{ label: 'Intro' }],
      mimetype: 'application/pdf',
      size: 100,
    }),
  ],
};

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('FilesDAOConsistency', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: 'tenant',
        featureFlags: { postgresFiles: usePostgres },
      });
      await testingEnvironment.setFixtures(fixtures);
    });

    const getDao = () => testingEnvironment.runWithContext(() => FilesDAOFactory.default());

    describe('getById', () => {
      it('returns file with correct shape when found', async () => {
        const dao = getDao();
        const result = await dao.getById(f.idString('doc_with_fulltext'));

        expect(result.isOk()).toBe(true);
        const data = result.getDataOrThrow();
        expect(data).toMatchObject({
          filename: 'doc_with_fulltext',
          originalname: 'doc_with_fulltext',
          size: 100,
          type: 'document',
          entity: 'entity_1',
          status: 'ready',
        });
        expect(data).toHaveProperty('_id');
        if (usePostgres) {
          expect(typeof data._id).toBe('string');
        } else {
          expect(data._id).toBeInstanceOf(ObjectId);
        }
      });

      it('includes fullText when withFullText is true', async () => {
        const dao = getDao();
        const result = await dao.getById(f.idString('doc_with_fulltext'), {
          withFullText: true,
        });

        expect(result.isOk()).toBe(true);
        const data = result.getDataOrThrow();
        expect(data).toMatchObject({
          filename: 'doc_with_fulltext',
          entity: 'entity_1',
          type: 'document',
          status: 'ready',
          fullText: { 1: 'page one content' },
        });
        expect(data).toHaveProperty('_id');
      });

      it('excludes fullText by default', async () => {
        const dao = getDao();
        const result = await dao.getById(f.idString('doc_with_fulltext'));

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).not.toHaveProperty('fullText');
      });

      it('excludes fullText when projection explicitly excludes it', async () => {
        const dao = getDao();
        const result = await dao.getById(f.idString('doc_with_fulltext'), {
          projection: { fullText: 0 },
        });

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).not.toHaveProperty('fullText');
      });

      it('explicit projection takes precedence over withFullText', async () => {
        const dao = getDao();
        const result = await dao.getById(f.idString('doc_with_fulltext'), {
          withFullText: true,
          projection: { fullText: 0 },
        });

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).not.toHaveProperty('fullText');
      });

      it('returns FileNotFound when id does not exist', async () => {
        const dao = getDao();
        const result = await dao.getById('000000000000000000000000');

        expect(result.isError()).toBe(true);
        expect(result.getError()).toBeInstanceOf(FileNotFound);
      });

      it('works for all file types', async () => {
        const dao = getDao();

        const docResult = await dao.getById(f.idString('doc_with_fulltext'));
        expect(docResult.getDataOrThrow().type).toBe('document');

        const attResult = await dao.getById(f.idString('att_1'));
        expect(attResult.getDataOrThrow().type).toBe('attachment');

        const customResult = await dao.getById(f.idString('custom_1'));
        expect(customResult.getDataOrThrow().type).toBe('custom');
      });

      it('thumbnail has expected shape', async () => {
        const dao = getDao();
        const result = await dao.getById(f.idString('thumb_1'));

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).toMatchObject({
          filename: 'thumb_1',
          type: 'thumbnail',
          entity: 'entity_1',
          mimetype: 'image/jpeg',
        });
      });

      it('does not include null values in returned rows', async () => {
        const dao = getDao();
        const result = await dao.getById(f.idString('doc_with_fulltext'));

        const data = result.getDataOrThrow();
        expect(data).not.toHaveProperty('url');
        if (usePostgres) {
          expect(typeof data.creationDate).toBe('number');
        }
        expect(typeof data.size).toBe('number');
      });
    });

    describe('getByFilename', () => {
      it('returns file with correct shape when found', async () => {
        const dao = getDao();
        const result = await dao.getByFilename('doc_with_fulltext');

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).toMatchObject({
          filename: 'doc_with_fulltext',
          type: 'document',
          entity: 'entity_1',
        });
        expect(result.getDataOrThrow()).toHaveProperty('_id');
      });

      it('excludes fullText by default', async () => {
        const dao = getDao();
        const result = await dao.getByFilename('doc_with_fulltext');

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).not.toHaveProperty('fullText');
      });

      it('includes fullText when withFullText is true', async () => {
        const dao = getDao();
        const result = await dao.getByFilename('doc_with_fulltext', {
          withFullText: true,
        });

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow()).toMatchObject({
          filename: 'doc_with_fulltext',
          fullText: { 1: 'page one content' },
        });
      });

      it('returns FileNotFound when filename does not exist', async () => {
        const dao = getDao();
        const result = await dao.getByFilename('nonexistent');

        expect(result.isError()).toBe(true);
        expect(result.getError()).toBeInstanceOf(FileNotFound);
      });
    });

    describe('getByEntity', () => {
      it('returns all files for entity when no type filter', async () => {
        const dao = getDao();
        const files = await dao.getByEntity('entity_a');

        expect(files).toHaveLength(4);
        expect(files.map(f => f.filename)).toEqual(
          expect.arrayContaining(['doc_a_1', 'doc_a_2', 'att_a', 'thumb_a'])
        );
      });

      it('returns only files matching given types', async () => {
        const dao = getDao();
        const files = await dao.getByEntity('entity_a', { types: ['document'] });

        expect(files).toHaveLength(2);
        expect(files.every(f => f.type === 'document')).toBe(true);
      });

      it('returns files matching multiple types', async () => {
        const dao = getDao();
        const files = await dao.getByEntity('entity_a', {
          types: ['document', 'attachment'],
        });

        expect(files).toHaveLength(3);
        expect(files.every(f => ['document', 'attachment'].includes(f.type))).toBe(true);
      });

      it('returns empty array when entity has no files', async () => {
        const dao = getDao();
        const files = await dao.getByEntity('nonexistent');

        expect(files).toEqual([]);
      });

      it('excludes fullText by default', async () => {
        const dao = getDao();
        const files = await dao.getByEntity('entity_1');

        const doc = files.find(f => f.filename === 'doc_with_fulltext');
        expect(doc).toBeDefined();
        expect(doc).not.toHaveProperty('fullText');
      });

      it('returns files with _id', async () => {
        const dao = getDao();
        const files = await dao.getByEntity('entity_a');

        expect(files.length).toBeGreaterThan(0);
        files.forEach(f => expect(f).toHaveProperty('_id'));
      });

      it('returns rows without null values for any file type', async () => {
        const dao = getDao();
        const files = await dao.getByEntity('entity_a');

        for (const file of files) {
          if (file.type !== 'attachment') {
            expect(file).not.toHaveProperty('url');
          }
          if (usePostgres) {
            expect(typeof file.creationDate).toBe('number');
          }
          expect(typeof file.size).toBe('number');
        }
      });
    });

    describe('getByEntitySharedIds', () => {
      it('returns all files for given sharedIds', async () => {
        const dao = getDao();
        const files = await dao.getByEntitySharedIds(['entity_x', 'entity_y']);

        expect(files).toHaveLength(4);
        expect(files.map(f => f.filename)).toEqual(
          expect.arrayContaining(['doc_x_en', 'doc_x_es', 'att_x_en', 'doc_y_en'])
        );
      });

      it('filters by language', async () => {
        const dao = getDao();
        const files = await dao.getByEntitySharedIds(['entity_x'], {
          languages: ['eng'],
        });

        expect(files).toHaveLength(2);
        expect(files.every(f => f.language === 'eng')).toBe(true);
      });

      it('filters by type', async () => {
        const dao = getDao();
        const files = await dao.getByEntitySharedIds(['entity_x'], {
          types: ['document'],
        });

        expect(files).toHaveLength(2);
        expect(files.every(f => f.type === 'document')).toBe(true);
      });

      it('combines language and type filters', async () => {
        const dao = getDao();
        const files = await dao.getByEntitySharedIds(['entity_x'], {
          languages: ['eng'],
          types: ['document'],
        });

        expect(files).toHaveLength(1);
        expect(files[0].filename).toBe('doc_x_en');
      });

      it('returns empty array when no sharedIds match', async () => {
        const dao = getDao();
        const files = await dao.getByEntitySharedIds(['nonexistent']);

        expect(files).toEqual([]);
      });

      it('excludes fullText by default', async () => {
        const dao = getDao();
        const files = await dao.getByEntitySharedIds(['entity_1']);

        const doc = files.find(f => f.filename === 'doc_with_fulltext');
        expect(doc).toBeDefined();
        expect(doc).not.toHaveProperty('fullText');
      });
    });

    describe('getByQuery', () => {
      it('returns matching files for simple equality query', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({ type: 'attachment' });

        expect(files.length).toBeGreaterThanOrEqual(1);
        expect(files.every(f => f.type === 'attachment')).toBe(true);
      });

      it('returns matching files for $in query', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({
          entity: { $in: ['entity_a', 'entity_x'] },
        });

        expect(files.length).toBeGreaterThanOrEqual(1);
        expect(files.every(f => ['entity_a', 'entity_x'].includes(f.entity!))).toBe(true);
      });

      it('excludes fullText by default', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({ filename: 'doc_with_fulltext' });

        expect(files).toHaveLength(1);
        expect(files[0]).not.toHaveProperty('fullText');
      });

      it('includes fullText when withFullText is true', async () => {
        const dao = getDao();
        const files = await dao.getByQuery(
          { filename: 'doc_with_fulltext' },
          { withFullText: true }
        );

        expect(files).toHaveLength(1);
        expect(files[0]).toMatchObject({
          filename: 'doc_with_fulltext',
          fullText: { 1: 'page one content' },
        });
      });

      it('returns empty array when query matches nothing', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({ filename: 'nonexistent' });

        expect(files).toEqual([]);
      });

      it('applies limit when provided', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({ type: 'document' }, { limit: 2 });

        expect(files).toHaveLength(2);
      });

      it('returns rows without null values', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({ type: 'document' });

        for (const file of files) {
          expect(file).not.toHaveProperty('url');
          if (usePostgres) {
            expect(typeof file.creationDate).toBe('number');
          }
        }
      });

      it('filters by $exists:true for nullable fields', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({ language: { $exists: true } });

        expect(files.length).toBeGreaterThan(0);
        files.forEach(f => expect(f.language).toBeTruthy());
      });

      it('filters by $exists:false for nullable fields', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({ language: { $exists: false } });

        expect(files.length).toBeGreaterThan(0);
        files.forEach(f => expect(f.language).toBeFalsy());
      });

      it('combines $exists with other filters', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({
          type: 'document',
          language: { $exists: true },
        });

        expect(files.length).toBeGreaterThan(0);
        files.forEach(f => {
          expect(f.type).toBe('document');
          expect(f.language).toBeTruthy();
        });
      });

      it('filters by $nin', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({
          entity: { $nin: ['entity_a', 'entity_x'] },
        });

        expect(files.length).toBeGreaterThan(0);
        files.forEach(f => {
          expect(f.entity).not.toBe('entity_a');
          expect(f.entity).not.toBe('entity_x');
        });
      });

      it('combines $nin with other filters', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({
          type: 'document',
          entity: { $nin: ['entity_a'] },
        });

        expect(files.length).toBeGreaterThan(0);
        files.forEach(f => {
          expect(f.type).toBe('document');
          expect(f.entity).not.toBe('entity_a');
        });
      });

      it('returns _id when projection uses inclusion mode', async () => {
        const dao = getDao();
        const files = await dao.getByQuery({ type: 'document' }, { projection: { filename: 1 } });

        expect(files.length).toBeGreaterThan(0);
        files.forEach(f => expect(f).toHaveProperty('_id'));
      });
    });

    describe('getNextDocumentWithoutToc', () => {
      it('returns a document with filename and no toc', async () => {
        const dao = getDao();
        const result = await dao.getNextDocumentWithoutToc();

        expect(result.isOk()).toBe(true);
        const file = result.getDataOrThrow();
        expect(file.type).toBe('document');
        expect(file.filename).toBeTruthy();
        expect(file).toHaveProperty('_id');
      });
    });

    describe('getDistinctEntitySharedIds', () => {
      it('returns distinct sharedIds filtered by type, status, and language', async () => {
        const dao = getDao();
        const result = await dao.getDistinctEntitySharedIds({
          type: 'document',
          status: 'ready',
          language: 'eng',
        });

        expect(result.sort()).toEqual(['entity_1', 'entity_x', 'entity_y']);
      });

      it('filters by type only', async () => {
        const dao = getDao();
        const result = await dao.getDistinctEntitySharedIds({ type: 'attachment' });

        expect(result.sort()).toEqual(['entity_1', 'entity_a', 'entity_x']);
      });
    });

    describe('countDocuments', () => {
      it('returns the total number of files', async () => {
        const dao = getDao();
        const count = await dao.countDocuments();

        expect(count).toBe(15);
      });
    });

    describe('getTotalFileSize', () => {
      it('returns the sum of all file sizes', async () => {
        const dao = getDao();
        const totalSize = await dao.getTotalFileSize();

        expect(totalSize).toBe(1500);
      });
    });
  });
});
