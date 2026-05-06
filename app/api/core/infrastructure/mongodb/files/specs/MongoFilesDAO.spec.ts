import { ObjectId } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { MongoFilesDAO } from '../MongoFilesDAO.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  files: [
    // included: type=document, status=ready, with fullText
    factory.document('ready_doc_1', {
      entity: 'entity_1',
      language: 'en',
      status: 'ready',
      fullText: { 1: 'page content here' },
    }),
    // included: type=document, status=ready, with fullText
    factory.document('ready_doc_3', {
      entity: 'entity_1',
      language: 'es',
      status: 'ready',
      fullText: { 1: 'more content here' },
    }),
    // excluded: type=document, status=ready, but NO fullText
    factory.document('ready_doc_2', {
      entity: 'entity_1',
      language: 'es',
      status: 'ready',
    }),
    // excluded: type=document, status=ready, but fullText is whitespace-only
    factory.document('whitespace_doc', {
      entity: 'entity_1',
      language: 'en',
      status: 'ready',
      fullText: { 1: '   ', 2: '\t\n' },
    }),
    // excluded: status=processing
    factory.document('processing_doc', {
      entity: 'entity_2',
      status: 'processing',
    }),
    // excluded: status=failed
    factory.document('failed_doc', {
      entity: 'entity_2',
      status: 'failed',
    } as any),
    // excluded: type=attachment
    factory.attachment('att_1', {
      entity: 'entity_1',
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

  describe('streamProcessedDocs()', () => {
    it('returns only documents with type=document, status=ready, and non-empty fullText', async () => {
      const sut = createSut();
      const files = await sut.streamProcessedDocs().toArray();
      expect(files).toHaveLength(2);
      expect(files.every(f => f.type === 'document')).toBe(true);
      expect(files.every(f => f.status === 'ready')).toBe(true);
    });

    it('excludes documents without fullText and documents with whitespace-only fullText', async () => {
      const sut = createSut();
      const files = await sut.streamProcessedDocs().toArray();
      const filenames = files.map(f => f.filename).sort();
      expect(filenames).toEqual(['ready_doc_1', 'ready_doc_3']);
    });

    it('excludes processing and failed documents', async () => {
      const sut = createSut();
      const files = await sut.streamProcessedDocs().toArray();
      const filenames = files.map(f => f.filename);
      expect(filenames).not.toContain('processing_doc');
      expect(filenames).not.toContain('failed_doc');
    });

    it('excludes attachments', async () => {
      const sut = createSut();
      const files = await sut.streamProcessedDocs().toArray();
      expect(files.every(f => f.type === 'document')).toBe(true);
    });

    it('includes the fullText field in returned documents', async () => {
      const sut = createSut();
      const files = await sut.streamProcessedDocs().toArray();
      const docWithFullText = files.find(f => f.filename === 'ready_doc_1');
      expect(docWithFullText?.fullText).toEqual({ 1: 'page content here' });
    });

    it('with afterId returns only files whose _id is greater than the checkpoint', async () => {
      const sut = createSut();
      const allFiles = await sut.streamProcessedDocs().toArray();
      expect(allFiles).toHaveLength(2);

      const checkpointId = allFiles[0]._id as unknown as ObjectId;
      const resumed = await sut.streamProcessedDocs({ afterId: checkpointId }).toArray();

      expect(resumed).toHaveLength(1);
      expect(resumed[0]._id).not.toEqual(checkpointId);
    });

    it('with afterId returns empty cursor when no files follow the checkpoint', async () => {
      const sut = createSut();
      const allFiles = await sut.streamProcessedDocs().toArray();
      const lastId = allFiles[allFiles.length - 1]._id as unknown as ObjectId;

      const resumed = await sut.streamProcessedDocs({ afterId: lastId }).toArray();
      expect(resumed).toHaveLength(0);
    });

    describe('when no processed documents exist', () => {
      beforeAll(async () => {
        await testingEnvironment.setUp({ files: [] });
      });

      it('returns an empty cursor', async () => {
        const sut = createSut();
        const files = await sut.streamProcessedDocs().toArray();
        expect(files).toHaveLength(0);
      });
    });
  });

  describe('countProcessedDocs()', () => {
    it('counts only documents with type=document, status=ready, and non-empty fullText', async () => {
      await testingEnvironment.setUp(fixtures);
      const sut = createSut();
      const count = await sut.countProcessedDocs();
      expect(count).toBe(2);
    });

    it('returns 0 when no indexable documents exist', async () => {
      await testingEnvironment.setUp({ files: [] });
      const sut = createSut();
      const count = await sut.countProcessedDocs();
      expect(count).toBe(0);
    });
  });
});
