import { Client as ESClient } from '@elastic/elasticsearch';
import { config } from '#api/config.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { DBFixture } from '#api/utils/testing_db.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { User } from '#api/users.v2/model/User.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { EntityESWriter } from '../entities/EntityESWriter.js';
import { EntityIndexMappingDefinition } from '../entities/EntityIndexMappingDefinition.js';
import type { MongoSlotsDAO } from '../entities/MongoSlotsDAO.js';
import { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO.js';
import { EntityIndexerService, EntityBatchInfo } from '../entities/EntityIndexerService.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';

const factory = getFixturesFactory();
const rawESClient = new ESClient({ node: config.elasticsearch.nodes });

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const testIndexName = `test_entity_indexer_${runId}`;
const testTenantId = `test_tenant_entity_indexer_${runId}`;

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en' as LanguageISO6391, label: 'English', default: true },
        { key: 'es' as LanguageISO6391, label: 'Spanish' },
      ],
    },
  ],
  templates: [factory.template('template_a', []), factory.template('template_b', [])],
  entities: [
    // entity_a has two language variants (en + es) — tests multi-language merge
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_a', 'template_a', {}),
    // entity_b has one language variant — template_a
    factory.entity('entity_b', 'template_a', {}, { language: 'en' }),
    // entity_c uses template_b — used for removeByTemplateIds test
    factory.entity('entity_c', 'template_b', {}, { language: 'en' }),
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

const createSut = (overrides?: { batchSize?: number; maxConcurrentWrites?: number }) => {
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

  const slotsDAO = TestUtils.mockClass<MongoSlotsDAO>({
    getSlotMap: jest.fn().mockResolvedValue(new Map()),
  });

  const writer = new EntityESWriter({ esClient: tenantClient });
  const entityDAO = new MongoEntityDAO(db, transactionManager, User.createFrom(null));
  const sut = new EntityIndexerService({ writer, entityDAO, slotsDAO, ...overrides });

  return { sut, slotsDAO, tenantClient };
};

const searchAll = async (tenantClient: TenantAwareESClient) =>
  tenantClient.search({
    alias: EntityIndexMappingDefinition.alias,
    query: { match_all: {} },
  });

const searchBySharedId = async (tenantClient: TenantAwareESClient, sharedId: string) =>
  tenantClient.search({
    alias: EntityIndexMappingDefinition.alias,
    query: { term: { sharedId } },
  });

describe('EntityIndexerService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    await createTestIndex();
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
      body: { query: { match_all: {} } },
      refresh: true,
    });
  });

  describe('index()', () => {
    it('fetches slotMap, maps provided entities, and writes them to ES', async () => {
      const { sut, slotsDAO, tenantClient } = createSut();
      const db = getConnection();
      const entityDAO = new MongoEntityDAO(
        db,
        TransactionManagerFactory.default(),
        User.createFrom(null)
      );
      const entities = await entityDAO.findBySharedIds(['entity_b']);

      await sut.index(entities, true);

      expect(slotsDAO.getSlotMap).toHaveBeenCalledTimes(1);
      const result = await searchBySharedId(tenantClient, 'entity_b');
      expect(result.hits.hits).toHaveLength(1);
    });
  });

  describe('sync()', () => {
    it('fetches entity from MongoDB and indexes it in ES', async () => {
      const { sut, tenantClient } = createSut();

      await sut.sync(['entity_b'], true);

      const result = await searchBySharedId(tenantClient, 'entity_b');
      expect(result.hits.hits).toHaveLength(1);
    });

    it('merges all language variants into a single ES document', async () => {
      const { sut, tenantClient } = createSut();

      await sut.sync(['entity_a'], true);

      const result = await searchBySharedId(tenantClient, 'entity_a');
      expect(result.hits.hits).toHaveLength(1);
      const { rawEntities } = result.hits.hits[0]._source as any;
      expect(Object.keys(rawEntities).sort()).toEqual(['en', 'es']);
    });

    it('indexes multiple sharedIds in a single call', async () => {
      const { sut, tenantClient } = createSut();

      await sut.sync(['entity_a', 'entity_b'], true);

      const resultA = await searchBySharedId(tenantClient, 'entity_a');
      expect(resultA.hits.hits).toHaveLength(1);

      const resultB = await searchBySharedId(tenantClient, 'entity_b');
      expect(resultB.hits.hits).toHaveLength(1);
    });

    it('is a no-op for empty input', async () => {
      const { sut, tenantClient } = createSut();

      await sut.sync([], true);

      const result = await searchAll(tenantClient);
      expect(result.hits.hits).toHaveLength(0);
    });
  });

  describe('syncAll()', () => {
    it('indexes all entities from MongoDB', async () => {
      const { sut, tenantClient } = createSut();

      await sut.syncAll(undefined, true);

      await ArrayUtils.parallelFor(['entity_a', 'entity_b', 'entity_c'], async sharedId => {
        const result = await searchBySharedId(tenantClient, sharedId);
        expect(result.hits.hits).toHaveLength(1);
      });
    });

    it('with afterSharedId skips entities up to and including the checkpoint', async () => {
      const { sut, tenantClient } = createSut();

      // entity_a < entity_b < entity_c lexicographically; resume after entity_b → only entity_c
      await sut.syncAll({ afterSharedId: 'entity_b' }, true);

      const result = await searchAll(tenantClient);
      const sharedIds = result.hits.hits.map((h: any) => h._source?.sharedId);
      expect(sharedIds).toEqual(['entity_c']);
    });

    it('calls onBatch after each flush with cumulative indexed count and lastSharedId', async () => {
      const batches: EntityBatchInfo[] = [];
      // batchSize=1 so each distinct sharedId group is its own batch
      const { sut } = createSut({ batchSize: 1 });

      await sut.syncAll({ onBatch: info => batches.push(info) }, true);

      // indexed counts ES documents (unique sharedIds), not Mongo rows.
      // entity_a has 2 Mongo docs (en+es) but collapses into 1 ES doc.
      //   flush entity_a → indexed=1, lastSharedId='entity_a'
      //   flush entity_b → indexed=2, lastSharedId='entity_b'
      //   flush entity_c → indexed=3, lastSharedId='entity_c'
      expect(batches).toHaveLength(3);
      expect(batches[0]).toEqual({ indexed: 1, lastSharedId: 'entity_a', total: 3 });
      expect(batches[1]).toEqual({ indexed: 2, lastSharedId: 'entity_b', total: 3 });
      expect(batches[2]).toEqual({ indexed: 3, lastSharedId: 'entity_c', total: 3 });
    });

    it('does not call onBatch when there are no entities', async () => {
      await testingEnvironment.setFixtures({ ...fixtures, entities: [] });

      const batches: EntityBatchInfo[] = [];
      const { sut } = createSut();

      await sut.syncAll({ onBatch: info => batches.push(info) }, true);

      expect(batches).toHaveLength(0);
    });

    describe('ghost cleanup', () => {
      const seedGhost = async (tenantClient: TenantAwareESClient, sharedId: string) => {
        await tenantClient.bulk({
          alias: EntityIndexMappingDefinition.alias,
          operations: [
            {
              id: sharedId,
              document: {
                sharedId,
                template: 'ghost_template',
                published: false,
                permissionRefIds: [],
                creationDate: 0,
                editDate: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                rawEntities: {},
                metadata: {},
                fullText: { name: 'entity' },
              },
            },
          ],
          routing: tenantClient.tenantId,
          refresh: true,
        });
      };

      it('deletes ghost ES documents that have no MongoDB counterpart', async () => {
        const { sut, tenantClient } = createSut();
        await seedGhost(tenantClient, 'ghost_z');

        await sut.syncAll(undefined, true);

        const ghostResult = await searchBySharedId(tenantClient, 'ghost_z');
        expect(ghostResult.hits.hits).toHaveLength(0);

        // real entities remain
        await ArrayUtils.parallelFor(['entity_a', 'entity_b', 'entity_c'], async sharedId => {
          const result = await searchBySharedId(tenantClient, sharedId);
          expect(result.hits.hits).toHaveLength(1);
        });
      });

      it('does not delete a ghost whose sharedId is before afterSharedId (out of scope)', async () => {
        const { sut, tenantClient } = createSut();
        // 'entity_aaa' sorts before 'entity_b' — seeding it as a ghost
        await seedGhost(tenantClient, 'entity_aaa');

        // resume after 'entity_b' — scope is (entity_b, +∞), so entity_aaa is out of range
        await sut.syncAll({ afterSharedId: 'entity_b' }, true);

        const ghostResult = await searchBySharedId(tenantClient, 'entity_aaa');
        expect(ghostResult.hits.hits).toHaveLength(1);
      });

      it('deletes a ghost whose sharedId is after afterSharedId (in scope)', async () => {
        const { sut, tenantClient } = createSut();
        // 'ghost_z' sorts after every entity_* — clearly in scope
        await seedGhost(tenantClient, 'ghost_z');

        await sut.syncAll({ afterSharedId: 'entity_b' }, true);

        const ghostResult = await searchBySharedId(tenantClient, 'ghost_z');
        expect(ghostResult.hits.hits).toHaveLength(0);
      });

      it('leaves real entities untouched when there are no ghosts', async () => {
        const { sut, tenantClient } = createSut();

        await sut.syncAll(undefined, true);

        const result = await searchAll(tenantClient);
        const sharedIds = result.hits.hits.map((h: any) => h._source?.sharedId).sort();
        expect(sharedIds).toEqual(['entity_a', 'entity_b', 'entity_c']);
      });
    });
  });

  describe('remove()', () => {
    it('removes indexed entities by sharedId and leaves others intact', async () => {
      const { sut, tenantClient } = createSut();
      await sut.syncAll(undefined, true);

      await sut.remove(['entity_a'], true);

      const removedResult = await searchBySharedId(tenantClient, 'entity_a');
      expect(removedResult.hits.hits).toHaveLength(0);

      const keptResult = await searchBySharedId(tenantClient, 'entity_b');
      expect(keptResult.hits.hits).toHaveLength(1);
    });
  });

  describe('removeByTemplateIds()', () => {
    it('removes entities matching the templateId and leaves others intact', async () => {
      const { sut, tenantClient } = createSut();
      await sut.syncAll(undefined, true);

      const templateBId = factory.id('template_b').toString();
      await sut.removeByTemplateIds([templateBId], true);

      const removedResult = await searchBySharedId(tenantClient, 'entity_c');
      expect(removedResult.hits.hits).toHaveLength(0);

      await ArrayUtils.parallelFor(['entity_a', 'entity_b'], async sharedId => {
        const keptResult = await searchBySharedId(tenantClient, sharedId);
        expect(keptResult.hits.hits).toHaveLength(1);
      });
    });
  });

  describe('syncAll() — concurrent writes', () => {
    it('indexes all entities correctly when using multiple concurrent writes', async () => {
      const { sut, tenantClient } = createSut({ batchSize: 1, maxConcurrentWrites: 2 });

      await sut.syncAll(undefined, true);

      const result = await searchAll(tenantClient);
      const sharedIds = result.hits.hits.map((h: any) => h._source?.sharedId).sort();
      expect(sharedIds).toEqual(['entity_a', 'entity_b', 'entity_c']);
    });

    it('collects all write errors and throws after every in-flight write settles', async () => {
      let batchNum = 0;
      const writeOrder: number[] = [];

      const mockWriter = {
        deleteBySharedIds: jest.fn(),
        deleteByTemplateIds: jest.fn(),
        index: jest.fn().mockImplementation(async () => {
          // eslint-disable-next-line no-plusplus
          const num = ++batchNum;
          writeOrder.push(num);
          if (num === 1) throw new Error('batch 1 failed');
        }),
      } as unknown as EntityESWriter;

      const db = getConnection();
      const transactionManager = TransactionManagerFactory.default();
      const entityDAO = new MongoEntityDAO(db, transactionManager, User.createFrom(null));
      const slotsDAO = TestUtils.mockClass<MongoSlotsDAO>({
        getSlotMap: jest.fn().mockResolvedValue(new Map()),
      });

      const sut = new EntityIndexerService({
        writer: mockWriter,
        entityDAO,
        slotsDAO,
        batchSize: 1,
        maxConcurrentWrites: 2,
      });

      await expect(sut.syncAll(undefined, false)).rejects.toThrow('batch 1 failed');
      expect(writeOrder.sort()).toEqual([1, 2, 3]);
    });
  });
});
