import { Client as ESClient } from '@elastic/elasticsearch';
import { ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { DBFixture } from '#api/utils/testing_db.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { FullTextESWriter } from '../entities/FullTextESWriter.js';
import { EntityIndexMappingDefinition } from '../entities/EntityIndexMappingDefinition.js';
import { MongoFilesDAO } from '../../mongodb/files/MongoFilesDAO.js';
import { FullTextIndexerService, FileBatchInfo } from '../entities/FullTextIndexerService.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';

const factory = getFixturesFactory();
const rawESClient = new ESClient({ node: config.elasticsearch.nodes });

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const testIndexName = `test_fulltext_indexer_${runId}`;
const testTenantId = `test_tenant_fulltext_indexer_${runId}`;

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en' as LanguageISO6391, label: 'English', default: true }] }],
  templates: [factory.template('template_a', [])],
  entities: [
    factory.entity('entity_a', 'template_a', {}, { language: 'en' }),
    factory.entity('entity_b', 'template_a', {}, { language: 'en' }),
    factory.entity('entity_c', 'template_a', {}, { language: 'en' }),
  ],
  files: [
    factory.document('doc_a', {
      entity: 'entity_a',
      language: 'en',
      status: 'ready',
      fullText: { 1: 'content of doc_a' },
    }),
    factory.document('doc_b', {
      entity: 'entity_b',
      language: 'en',
      status: 'ready',
      fullText: { 1: 'content of doc_b' },
    }),
    factory.document('doc_c', {
      entity: 'entity_c',
      language: 'en',
      status: 'ready',
      fullText: { 1: 'content of doc_c' },
    }),
    // These should NOT be indexed (wrong status / wrong type)
    factory.document('doc_processing', { entity: 'entity_a', status: 'processing' }),
    factory.attachment('att_a', { entity: 'entity_a' }),
  ],
};

const createTestIndex = async () => {
  await rawESClient.indices.create({
    index: testIndexName,
    body: {
      settings: {
        ...EntityIndexMappingDefinition.settings,
        number_of_shards: 1,
        number_of_replicas: 0,
      },
      mappings: EntityIndexMappingDefinition.mappings,
    },
  });
};

const deleteTestIndex = async () =>
  rawESClient.indices.delete({ index: testIndexName, ignore_unavailable: true });

/** Pre-index a parent entity doc so fulltext child joins work correctly in ES. */
const indexEntityParent = async (sharedId: string) => {
  await rawESClient.index({
    index: testIndexName,
    id: `${testTenantId}__${sharedId}`,
    routing: testTenantId,
    body: { tenantId: testTenantId, sharedId, fullText: { name: 'entity' } },
    refresh: true,
  });
};

const createSut = (overrides?: { byteThreshold?: number; maxConcurrentWrites?: number }) => {
  const db = getConnection();
  const transactionManager = TransactionManagerFactory.default();

  const resolver = TestUtils.mockClass<IndexNameResolver>({
    resolve: jest.fn().mockResolvedValue(testIndexName),
    invalidate: jest.fn(),
  });

  const tenantClient = new TenantAwareESClient({
    client: rawESClient,
    resolver,
    tenantId: testTenantId,
  });

  const writer = new FullTextESWriter({ esClient: tenantClient });
  const filesDAO = new MongoFilesDAO({ db, transactionManager });
  const sut = new FullTextIndexerService({ writer, filesDAO, ...overrides });

  return { sut, tenantClient };
};

const searchFulltextDocs = async (tenantClient: TenantAwareESClient) =>
  tenantClient.search({
    alias: EntityIndexMappingDefinition.alias,
    query: { term: { fullText: 'fullText' } },
  });

const searchByFilename = async (tenantClient: TenantAwareESClient, filename: string) =>
  tenantClient.search({
    alias: EntityIndexMappingDefinition.alias,
    query: {
      bool: {
        filter: [{ term: { filename } }, { term: { fullText: 'fullText' } }],
      },
    },
  });

describe('FullTextIndexerService', () => {
  jest.setTimeout(30_000);
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    await createTestIndex();
    // Parent entity docs must exist before fulltext children can be indexed
    await ArrayUtils.parallelFor(['entity_a', 'entity_b', 'entity_c'], indexEntityParent);
  });

  afterAll(async () => {
    await deleteTestIndex();
    await testingEnvironment.tearDown();
    await rawESClient.close();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await rawESClient.deleteByQuery({
      index: testIndexName,
      conflicts: 'proceed',
      body: { query: { term: { fullText: 'fullText' } } },
      refresh: true,
    });
  });

  describe('syncAll()', () => {
    it('indexes all ready document files from MongoDB', async () => {
      const { sut, tenantClient } = createSut();

      await sut.syncAll(undefined, true);

      const result = await searchFulltextDocs(tenantClient);
      const filenames = result.hits.hits.map((h: any) => h._source?.filename).sort();
      expect(filenames).toEqual(['doc_a', 'doc_b', 'doc_c']);
    });

    it('does not index files with status processing or type attachment', async () => {
      const { sut, tenantClient } = createSut();

      await sut.syncAll(undefined, true);

      const result = await searchFulltextDocs(tenantClient);
      const filenames = result.hits.hits.map((h: any) => h._source?.filename);
      expect(filenames).not.toContain('doc_processing');
      expect(filenames).not.toContain('att_a');
    });

    it('with afterId skips files up to and including the checkpoint', async () => {
      const readyFiles = await getConnection()
        .collection('files')
        .find({ type: 'document', status: 'ready' })
        .sort({ _id: 1 })
        .toArray();
      expect(readyFiles.length).toBeGreaterThanOrEqual(2);
      const firstFileId = readyFiles[0]._id as unknown as ObjectId;

      const { sut, tenantClient } = createSut();
      await sut.syncAll({ afterId: firstFileId }, true);

      const result = await searchFulltextDocs(tenantClient);
      // Only files after the first one are indexed
      expect(result.hits.hits).toHaveLength(readyFiles.length - 1);
      const filenames = result.hits.hits.map((h: any) => h._source?.filename);
      expect(filenames).not.toContain(readyFiles[0].filename);
    });

    it('calls onBatch with cumulative indexed count, total, and lastFileId', async () => {
      const batches: FileBatchInfo[] = [];
      // byteThreshold=1 so each file exceeds the threshold and is flushed individually
      const { sut } = createSut({ byteThreshold: 1 });

      await sut.syncAll({ onBatch: info => batches.push(info) }, true);

      expect(batches).toHaveLength(3);
      expect(batches[0].indexed).toBe(1);
      expect(batches[1].indexed).toBe(2);
      expect(batches[2].indexed).toBe(3);
      batches.forEach(b => {
        expect(b.total).toBe(3);
        expect(typeof b.lastFileId).toBe('string');
        expect(b.lastFileId.length).toBeGreaterThan(0);
      });
    });

    it('does not call onBatch when there are no ready documents', async () => {
      await testingEnvironment.setFixtures({ ...fixtures, files: [] });

      const batches: FileBatchInfo[] = [];
      const { sut } = createSut();

      await sut.syncAll({ onBatch: info => batches.push(info) }, true);

      expect(batches).toHaveLength(0);
    });
  });

  describe('remove()', () => {
    it('removes indexed fulltext docs by filename and leaves others intact', async () => {
      const { sut, tenantClient } = createSut();
      await sut.syncAll(undefined, true);

      await sut.remove(['doc_a'], true);

      const removedResult = await searchByFilename(tenantClient, 'doc_a');
      expect(removedResult.hits.hits).toHaveLength(0);

      await ArrayUtils.parallelFor(['doc_b', 'doc_c'], async filename => {
        const keptResult = await searchByFilename(tenantClient, filename);
        expect(keptResult.hits.hits).toHaveLength(1);
      });
    });
  });

  describe('index()', () => {
    it('maps provided files and writes them to ES', async () => {
      const { sut, tenantClient } = createSut();

      const db = getConnection();
      const readyDocs = await db
        .collection('files')
        .find({ type: 'document', status: 'ready' })
        .toArray();
      const dbos = readyDocs.map(d => d as any);

      await sut.index(dbos, true);

      const result = await searchFulltextDocs(tenantClient);
      expect(result.hits.hits).toHaveLength(3);
    });

    it('silently skips files rejected by the mapper (no fullText)', async () => {
      const { sut, tenantClient } = createSut();

      const db = getConnection();
      const processingDoc = await db.collection('files').findOne({ filename: 'doc_processing' });

      await sut.index([processingDoc as any], true);

      const result = await searchFulltextDocs(tenantClient);
      expect(result.hits.hits).toHaveLength(0);
    });
  });

  describe('syncAll() — concurrent writes', () => {
    it('indexes all documents correctly when using multiple concurrent writes', async () => {
      const { sut, tenantClient } = createSut({ byteThreshold: 1, maxConcurrentWrites: 2 });

      await sut.syncAll(undefined, true);

      const result = await searchFulltextDocs(tenantClient);
      const filenames = result.hits.hits.map((h: any) => h._source?.filename).sort();
      expect(filenames).toEqual(['doc_a', 'doc_b', 'doc_c']);
    });

    it('collects all write errors and throws after every in-flight write settles', async () => {
      let batchNum = 0;
      const writeOrder: number[] = [];

      const mockWriter = {
        tenantId: testTenantId,
        deleteByFilenames: jest.fn(),
        index: jest.fn().mockImplementation(async () => {
          // eslint-disable-next-line no-plusplus
          const num = ++batchNum;
          writeOrder.push(num);
          if (num === 1) throw new Error('batch 1 failed');
        }),
      } as unknown as FullTextESWriter;

      const db = getConnection();
      const transactionManager = TransactionManagerFactory.default();
      const filesDAO = new MongoFilesDAO({ db, transactionManager });

      const sut = new FullTextIndexerService({
        writer: mockWriter,
        filesDAO,
        byteThreshold: 1,
        maxConcurrentWrites: 2,
      });

      await expect(sut.syncAll(undefined, false)).rejects.toThrow('batch 1 failed');
      // All 3 batches were dispatched and settled despite the failure in batch 1
      expect(writeOrder.sort()).toEqual([1, 2, 3]);
    });
  });
});
