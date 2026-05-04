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
    // included: type=document, status=ready, no fullText
    factory.document('ready_doc_2', {
      entity: 'entity_1',
      language: 'es',
      status: 'ready',
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
    it('returns only documents with type=document and status=ready', async () => {
      const sut = createSut();
      const files = await sut.streamProcessedDocs().toArray();
      expect(files).toHaveLength(2);
      expect(files.every(f => f.type === 'document')).toBe(true);
      expect(files.every(f => f.status === 'ready')).toBe(true);
    });

    it('excludes processing and failed documents', async () => {
      const sut = createSut();
      const files = await sut.streamProcessedDocs().toArray();
      const filenames = files.map(f => f.filename).sort();
      expect(filenames).toEqual(['ready_doc_1', 'ready_doc_2']);
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
});
