import { Client as ESClient } from '@elastic/elasticsearch';
import { ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { FullTextESWriter } from '../entities/FullTextESWriter.js';
import { EntityIndexMappingDefinition } from '../entities/EntityIndexMappingDefinition.js';
import type { FullTextElasticDocument } from '../entities/FullTextElasticDocument.js';
import type { MappedDocument } from '../entities/FullTextElasticDocumentMapper.js';

const esClient = new ESClient({ node: config.elasticsearch.nodes });
const indexName = `fulltext-indexer-service-test-${Date.now()}-${Math.random()}`;

const recreateTestIndex = async () => {
  await esClient.indices.delete({ index: indexName, ignore_unavailable: true });

  await esClient.indices.create({
    index: indexName,
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

const createMappedDoc = (
  sharedId: string,
  fileId: ObjectId,
  tenantId: string,
  language = 'english',
  text = 'hello world',
  filename = 'test.pdf'
): MappedDocument => ({
  id: `${sharedId}_${fileId.toString()}`,
  document: {
    [`fullText_${language}`]: text,
    filename,
    fullText: {
      name: 'fullText',
      parent: `${tenantId}__${sharedId}`,
    },
  } as FullTextElasticDocument,
});

const indexEntityParent = async (tenantId: string, sharedId: string) => {
  await esClient.index({
    index: indexName,
    id: `${tenantId}__${sharedId}`,
    routing: tenantId,
    body: { tenantId, sharedId, fullText: { name: 'entity' } },
    refresh: true,
  });
};

const createSut = (tenantId = 'tenant-a') => {
  const resolver = TestUtils.mockClass<IndexNameResolver>({
    resolve: jest.fn().mockResolvedValue(indexName),
    invalidate: jest.fn(),
  });

  const tenantClient = new TenantAwareESClient({ client: esClient, resolver, tenantId });

  const sut = new FullTextESWriter({ esClient: tenantClient });

  return { sut, tenantClient };
};

// ── Fixtures ──────────────────────────────────────────────────────────────────
const sharedId1 = 'shared-1';
const sharedIdDelete = 'shared-delete';
const sharedIdKeep = 'shared-keep';

describe('FullTextESWriter', () => {
  jest.setTimeout(30_000);
  beforeEach(async () => {
    await recreateTestIndex();
    await indexEntityParent('tenant-a', sharedId1);
    await indexEntityParent('tenant-a', sharedIdDelete);
    await indexEntityParent('tenant-a', sharedIdKeep);
    await indexEntityParent('tenant-b', sharedId1);
  });

  afterAll(async () => {
    try {
      await esClient.indices.delete({ index: indexName, ignore_unavailable: true });
    } catch (e) {
      // Ignore cleanup errors
    }
    await esClient.close();
  });

  describe('index()', () => {
    it('indexes a fullText document with the correct structure', async () => {
      const { sut, tenantClient } = createSut('tenant-a');
      const fileId = new ObjectId();
      const doc = createMappedDoc(sharedId1, fileId, 'tenant-a');

      await sut.index([doc], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(result.hits.hits).toHaveLength(1);
      const hit = result.hits.hits[0];
      expect(hit._id).toBe(`tenant-a__${sharedId1}_${fileId.toString()}`);
      expect(hit._routing).toBe('tenant-a');
      expect(hit._source).toMatchObject({
        tenantId: 'tenant-a',
        filename: 'test.pdf',
        fullText_english: 'hello world',
        fullText: { name: 'fullText', parent: `tenant-a__${sharedId1}` },
      });
    });

    it('two files for the same sharedId produce two fullText documents with the same parent', async () => {
      const { sut, tenantClient } = createSut('tenant-a');
      const doc1 = createMappedDoc(sharedId1, new ObjectId(), 'tenant-a');
      const doc2 = createMappedDoc(sharedId1, new ObjectId(), 'tenant-a');

      await sut.index([doc1, doc2], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(result.hits.hits).toHaveLength(2);
      for (const hit of result.hits.hits) {
        expect(hit._source).toMatchObject({
          fullText: { parent: `tenant-a__${sharedId1}` },
        });
      }
    });

    it('is a no-op for empty input', async () => {
      const { sut } = createSut('tenant-a');

      await expect(sut.index([])).resolves.toBeUndefined();
    });
  });

  describe('deleteByFilenames()', () => {
    it('deletes fullText docs matching the given filenames', async () => {
      const { sut, tenantClient } = createSut('tenant-a');
      const docDelete = createMappedDoc(
        sharedIdDelete,
        new ObjectId(),
        'tenant-a',
        'english',
        'hello world',
        'delete.pdf'
      );
      const docKeep = createMappedDoc(
        sharedIdKeep,
        new ObjectId(),
        'tenant-a',
        'english',
        'hello world',
        'keep.pdf'
      );
      await sut.index([docDelete, docKeep], true);

      await sut.deleteByFilenames([docDelete.document.filename], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(result.hits.hits).toHaveLength(1);
      expect(result.hits.hits[0]._source!.filename).toBe(docKeep.document.filename);
    });

    it('respects tenant isolation', async () => {
      const { sut: sutA } = createSut('tenant-a');
      const { sut: sutB, tenantClient: tcB } = createSut('tenant-b');
      const docA = createMappedDoc(sharedId1, new ObjectId(), 'tenant-a');
      const docB = createMappedDoc(sharedId1, new ObjectId(), 'tenant-b');

      await sutA.index([docA], true);
      await sutB.index([docB], true);
      await sutA.deleteByFilenames([docA.document.filename], true);

      const resultB = await tcB.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(resultB.hits.hits).toHaveLength(1);
      expect(resultB.hits.hits[0]._source!.filename).toBe(docB.document.filename);
    });

    it('is a no-op for empty input', async () => {
      const { sut } = createSut('tenant-a');
      await expect(sut.deleteByFilenames([])).resolves.toBeUndefined();
    });
  });
});
