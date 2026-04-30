/* eslint-disable max-statements */
import { Client as ESClient } from '@elastic/elasticsearch';
import { ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import type { LanguageISO6393 } from '#shared/language/languageISO639_3.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { FullTextESWriter } from '../entities/FullTextESWriter.js';
import { EntityIndexMappingDefinition } from '../entities/EntityIndexMappingDefinition.js';
import type { FullTextElasticDocument } from '../entities/FullTextElasticDocument.js';
import type { ProcessedPDFDBO } from '../../mongodb/files/schemas/filesTypes.js';

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

const createFile = (
  sharedId: string,
  language: LanguageISO6393 = 'eng',
  fullText: ProcessedPDFDBO['fullText'] = { 1: 'hello world' },
  filename = 'test.pdf'
): ProcessedPDFDBO => ({
  _id: new ObjectId(),
  originalname: filename,
  filename,
  mimetype: 'application/pdf',
  size: 1000,
  creationDate: 1000,
  type: 'document',
  entity: sharedId,
  totalPages: 1,
  language,
  status: 'ready',
  fullText,
  generatedToc: false,
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
      const file = createFile(sharedId1);

      await sut.index([file], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(result.hits.hits).toHaveLength(1);
      const hit = result.hits.hits[0];
      expect(hit._id).toBe(`tenant-a__${sharedId1}_${file._id.toString()}`);
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
      const file1 = createFile(sharedId1);
      const file2 = createFile(sharedId1);

      await sut.index([file1, file2], true);

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

    it('skips files with no fullText content', async () => {
      const { sut, tenantClient } = createSut('tenant-a');
      const file: ProcessedPDFDBO = { ...createFile(sharedId1), fullText: undefined };

      await sut.index([file], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(result.hits.hits).toHaveLength(0);
    });

    it('skips files whose fullText pages are all empty or whitespace', async () => {
      const { sut, tenantClient } = createSut('tenant-a');
      const file = createFile(sharedId1, 'eng', { 1: '', 2: '   ' });

      await sut.index([file], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(result.hits.hits).toHaveLength(0);
    });

    it('is a no-op for empty input', async () => {
      const { sut } = createSut('tenant-a');

      await expect(sut.index([])).resolves.toBeUndefined();
    });
  });

  describe('deleteByFilenames()', () => {
    it('deletes fullText docs matching the given filenames', async () => {
      const { sut, tenantClient } = createSut('tenant-a');
      const fileDelete = createFile(sharedId1, 'eng', { 1: 'hello world' }, 'delete.pdf');
      const fileKeep = createFile(sharedId1, 'eng', { 1: 'hello world' }, 'keep.pdf');
      await sut.index([fileDelete, fileKeep], true);

      await sut.deleteByFilenames([fileDelete.filename], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(result.hits.hits).toHaveLength(1);
      expect(result.hits.hits[0]._source!.filename).toBe(fileKeep.filename);
    });

    it('respects tenant isolation', async () => {
      const { sut: sutA } = createSut('tenant-a');
      const { sut: sutB, tenantClient: tcB } = createSut('tenant-b');
      const file = createFile(sharedId1);

      await sutA.index([file], true);
      await sutB.index([file], true);
      await sutA.deleteByFilenames([file.filename], true);

      const resultB = await tcB.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(resultB.hits.hits).toHaveLength(1);
      expect(resultB.hits.hits[0]._source!.filename).toBe(file.filename);
    });

    it('is a no-op for empty input', async () => {
      const { sut } = createSut('tenant-a');
      await expect(sut.deleteByFilenames([])).resolves.toBeUndefined();
    });
  });
});
