import { Client as ESClient } from '@elastic/elasticsearch';
import { ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { EntityIndexerService } from '../entities/EntityIndexerService.js';
import { EntityIndexMappingDefinition } from '../entities/EntityIndexMappingDefinition.js';
import type { MongoSlotsDAO, SlotMap } from '../entities/MongoSlotsDAO.js';
import { EntityElasticDocument } from '../entities/EntityElasticDocument.js';

const esClient = new ESClient({ node: config.elasticsearch.nodes });
const indexName = `entity-indexer-service-test-${Date.now()}-${Math.random()}`;

const recreateTestIndex = async () => {
  await esClient.indices.delete({ index: indexName, ignore_unavailable: true });

  await esClient.indices.create({
    index: indexName,
    body: {
      settings: {
        ...EntityIndexMappingDefinition.settings,
        number_of_shards: 1,
        number_of_replicas: 0,
        'index.mapping.total_fields.limit': 5000,
      },
      mappings: EntityIndexMappingDefinition.mappings,
    },
  });
};

const createEntity = (sharedId: string, language: string, textValue: string): EntityDBO => ({
  _id: new ObjectId(),
  sharedId,
  language,
  template: new ObjectId(),
  title: `Title ${language}`,
  metadata: {
    indexedText: [{ value: textValue }],
  },
  obsoleteMetadata: [],
  published: true,
  creationDate: 1000,
  editDate: 2000,
  user: new ObjectId(),
  permissions: [],
});

const createSlotMap = (): SlotMap =>
  new Map([
    [
      'indexedText',
      {
        _id: new ObjectId(),
        assignedTo: 'indexedText',
        slotName: 'txt_01',
        type: 'text',
      },
    ],
  ]);

const createSut = (tenantId = 'tenant-a') => {
  const resolver = TestUtils.mockClass<IndexNameResolver>({
    resolve: jest.fn().mockResolvedValue(indexName),
    invalidate: jest.fn(),
  });

  const tenantClient = new TenantAwareESClient({
    client: esClient,
    resolver,
    tenantId,
  });

  const slotsDAO = TestUtils.mockClass<MongoSlotsDAO>({
    getSlotMap: jest.fn().mockResolvedValue(createSlotMap()),
  });

  const sut = new EntityIndexerService({
    esClient: tenantClient,
    slotsDAO,
    tenantId,
  });

  return { sut, slotsDAO, tenantClient };
};

const indexTwoLanguageVariants = async (sut: EntityIndexerService) => {
  const entityEn = createEntity('shared-1', 'en', 'hello');
  const entityEs = createEntity('shared-1', 'es', 'hola');

  await sut.index([entityEn, entityEs], true);

  return { entityEn, entityEs };
};

describe('EntityIndexerService', () => {
  beforeEach(async () => {
    await recreateTestIndex();
  });

  afterAll(async () => {
    try {
      await esClient.indices.delete({ index: indexName, ignore_unavailable: true });
    } catch (e) {
      // Ignore cleanup errors
    }
    await esClient.close();
  });

  it('indexes entities using tenant routing and stamps tenant-scoped ids', async () => {
    const { sut, tenantClient } = createSut('tenant-a');
    const { entityEn, entityEs } = await indexTwoLanguageVariants(sut);

    const indexedEntities = await tenantClient.search<EntityElasticDocument>({
      alias: EntityIndexMappingDefinition.alias,
      query: { match_all: {} },
    });

    expect(indexedEntities.hits.hits.length).toBe(2);

    expect(indexedEntities.hits.hits).toEqual([
      {
        _index: indexName,
        _id: `tenant-a__${entityEn._id.toString()}`,
        _score: 1,
        _routing: 'tenant-a',
        _source: {
          sharedId: 'shared-1',
          language: 'en',
          template: entityEn.template.toString(),
          title: 'Title en',
          rawEntity: {
            _id: entityEn._id.toString(),
            sharedId: 'shared-1',
            language: 'en',
            template: entityEn.template.toString(),
            title: 'Title en',
            metadata: { indexedText: [{ value: 'hello' }] },
            obsoleteMetadata: [],
            published: true,
            creationDate: 1000,
            editDate: 2000,
            user: entityEn.user?.toString(),
            permissions: [],
          },
          metadata: { txt_01: ['hello'] },
          published: true,
          permissionRefIds: [],
          user: entityEn.user?.toString(),
          creationDate: 1000,
          editDate: 2000,
          fullText: { name: 'entity' },
          tenantId: 'tenant-a',
        },
      },
      {
        _index: indexName,
        _id: `tenant-a__${entityEs._id.toString()}`,
        _score: 1,
        _routing: 'tenant-a',
        _source: {
          sharedId: 'shared-1',
          language: 'es',
          template: entityEs.template.toString(),
          title: 'Title es',
          rawEntity: {
            _id: entityEs._id.toString(),
            sharedId: 'shared-1',
            language: 'es',
            template: entityEs.template.toString(),
            title: 'Title es',
            metadata: { indexedText: [{ value: 'hola' }] },
            obsoleteMetadata: [],
            published: true,
            creationDate: 1000,
            editDate: 2000,
            user: entityEs.user?.toString(),
            permissions: [],
          },
          metadata: { txt_01: ['hola'] },
          published: true,
          permissionRefIds: [],
          user: entityEs.user?.toString(),
          creationDate: 1000,
          editDate: 2000,
          fullText: { name: 'entity' },
          tenantId: 'tenant-a',
        },
      },
    ]);
  });

  it('delete issues tenant-routed deleteByQuery by sharedIds', async () => {
    const { sut, tenantClient } = createSut('tenant-a');

    await sut.index(
      [
        createEntity('shared-delete', 'en', 'delete en'),
        createEntity('shared-delete', 'es', 'delete es'),
        createEntity('shared-keep', 'en', 'keep en'),
      ],
      true
    );

    await sut.delete(['shared-delete'], true);

    const result = await tenantClient.search<EntityElasticDocument>({
      alias: EntityIndexMappingDefinition.alias,
      query: {
        match_all: {},
      },
    });

    expect(result.hits.hits).toHaveLength(1);
    expect(result.hits.hits[0]._source!.sharedId).toBe('shared-keep');
  });

  it('is a no-op for empty inputs', async () => {
    const { sut, slotsDAO } = createSut('tenant-a');

    await sut.index([]);
    await sut.delete([]);

    expect(slotsDAO.getSlotMap).not.toHaveBeenCalled();

    const result = await esClient.search({
      index: indexName,
      body: { query: { match_all: {} } },
    });

    expect((result.body as any).hits.hits).toHaveLength(0);
  });
});
