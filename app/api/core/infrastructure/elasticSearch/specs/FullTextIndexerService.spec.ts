/* eslint-disable max-statements */
import { Client as ESClient } from '@elastic/elasticsearch';
import { ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import type { LanguageISO6393 } from '#shared/language/languageISO639_3.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { FullTextIndexerService } from '../entities/FullTextIndexerService.js';
import { EntityIndexMappingDefinition } from '../entities/EntityIndexMappingDefinition.js';
import type { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO.js';
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

const indexEntityParent = async (tenantId: string, entityId: ObjectId, sharedId: string) => {
  await esClient.index({
    index: indexName,
    id: `${tenantId}__${entityId.toString()}`,
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

  const entityDAO = TestUtils.mockClass<MongoEntityDAO>({
    getEntityIdsBySharedId: jest.fn(),
  });

  const sut = new FullTextIndexerService({ esClient: tenantClient, entityDAO });

  return { sut, tenantClient, entityDAO };
};

// ── Fixtures ──────────────────────────────────────────────────────────────────
// Stable entity ObjectIds re-indexed into a fresh ES index on each beforeEach.
const entityA = { _id: new ObjectId(), sharedId: 'shared-1' };
const entityAVariant = { _id: new ObjectId(), sharedId: 'shared-1' };
const entityADelete = { _id: new ObjectId(), sharedId: 'shared-delete' };
const entityAKeep = { _id: new ObjectId(), sharedId: 'shared-keep' };
const entityB = { _id: new ObjectId(), sharedId: 'shared-1' };

describe('FullTextIndexerService', () => {
  beforeEach(async () => {
    await recreateTestIndex();
    await indexEntityParent('tenant-a', entityA._id, entityA.sharedId);
    await indexEntityParent('tenant-a', entityAVariant._id, entityAVariant.sharedId);
    await indexEntityParent('tenant-a', entityADelete._id, entityADelete.sharedId);
    await indexEntityParent('tenant-a', entityAKeep._id, entityAKeep.sharedId);
    await indexEntityParent('tenant-b', entityB._id, entityB.sharedId);
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
      const { sut, tenantClient, entityDAO } = createSut('tenant-a');
      const file = createFile('shared-1');
      (entityDAO.getEntityIdsBySharedId as jest.Mock).mockResolvedValue([entityA]);

      await sut.index([file], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(result.hits.hits).toHaveLength(1);
      const hit = result.hits.hits[0];
      expect(hit._id).toBe(`tenant-a__${entityA._id.toString()}_${file._id.toString()}`);
      expect(hit._routing).toBe('tenant-a');
      expect(hit._source).toMatchObject({
        tenantId: 'tenant-a',
        filename: 'test.pdf',
        fullText_english: 'hello world',
        fullText: { name: 'fullText', parent: `tenant-a__${entityA._id.toString()}` },
      });
    });

    it('replicates a file across all entity language variants', async () => {
      const { sut, tenantClient, entityDAO } = createSut('tenant-a');
      const file = createFile('shared-1');
      (entityDAO.getEntityIdsBySharedId as jest.Mock).mockResolvedValue([entityA, entityAVariant]);

      await sut.index([file], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      const ids = result.hits.hits.map(h => h._id).sort();
      expect(ids).toEqual(
        [
          `tenant-a__${entityA._id.toString()}_${file._id.toString()}`,
          `tenant-a__${entityAVariant._id.toString()}_${file._id.toString()}`,
        ].sort()
      );
    });

    it('skips files with no fullText content', async () => {
      const { sut, tenantClient, entityDAO } = createSut('tenant-a');
      const file: ProcessedPDFDBO = { ...createFile('shared-1'), fullText: undefined };
      (entityDAO.getEntityIdsBySharedId as jest.Mock).mockResolvedValue([entityA]);

      await sut.index([file], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(result.hits.hits).toHaveLength(0);
    });

    it('skips files whose fullText pages are all empty or whitespace', async () => {
      const { sut, tenantClient, entityDAO } = createSut('tenant-a');
      const file = createFile('shared-1', 'eng', { 1: '', 2: '   ' });
      (entityDAO.getEntityIdsBySharedId as jest.Mock).mockResolvedValue([entityA]);

      await sut.index([file], true);

      const result = await tenantClient.search<FullTextElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { term: { fullText: 'fullText' } },
      });
      expect(result.hits.hits).toHaveLength(0);
    });

    it('is a no-op for empty input', async () => {
      const { sut, entityDAO } = createSut('tenant-a');

      await sut.index([]);

      expect(entityDAO.getEntityIdsBySharedId).not.toHaveBeenCalled();
    });
  });

  describe('deleteByFilenames()', () => {
    it('deletes fullText docs matching the given filenames', async () => {
      const { sut, tenantClient, entityDAO } = createSut('tenant-a');
      const fileDelete = createFile('shared-1', 'eng', { 1: 'hello world' }, 'delete.pdf');
      const fileKeep = createFile('shared-1', 'eng', { 1: 'hello world' }, 'keep.pdf');
      (entityDAO.getEntityIdsBySharedId as jest.Mock).mockResolvedValue([entityA]);
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
      const { sut: sutA, entityDAO: entityDAOA } = createSut('tenant-a');
      const { sut: sutB, tenantClient: tcB, entityDAO: entityDAOB } = createSut('tenant-b');
      const file = createFile('shared-1');
      (entityDAOA.getEntityIdsBySharedId as jest.Mock).mockResolvedValue([entityA]);
      (entityDAOB.getEntityIdsBySharedId as jest.Mock).mockResolvedValue([entityB]);

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
