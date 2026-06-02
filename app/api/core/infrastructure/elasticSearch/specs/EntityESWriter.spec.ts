/* eslint-disable max-statements */
import { Client as ESClient } from '@elastic/elasticsearch';
import { ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { EntityESWriter } from '../entities/EntityESWriter.js';
import { EntityIndexMappingDefinition } from '../entities/EntityIndexMappingDefinition.js';
import type { SlotMap } from '../entities/MongoSlotsDAO.js';
import { EntityElasticDocument } from '../entities/EntityElasticDocument.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { EntityElasticDocumentMapper } from '../entities/EntityElasticDocumentMapper.js';
import type { MappedDocument } from '../entities/EntityElasticDocumentMapper.js';

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

const createEntity = (
  sharedId: string,
  language: string,
  textValue: string,
  template = new ObjectId()
): EntityDBO => ({
  _id: new ObjectId(),
  sharedId,
  language,
  template,
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

// Composite key (translatable): 'propertyName::language'
const translatableSlotKey = (assignedTo: string, language: string) => `${assignedTo}::${language}`;

/**
 * Creates a SlotMap with translatable txt slots for `indexedText` keyed per language.
 * Slot names are txt_01, txt_02, ... in the order languages are given.
 */
const createSlotMap = (languages: LanguageISO6391[] = ['en']): SlotMap =>
  new Map(
    languages.map((lang, i) => [
      translatableSlotKey('indexedText', lang),
      {
        _id: new ObjectId(),
        assignedTo: 'indexedText',
        slotName: `txt_0${i + 1}`,
        type: 'txt' as const,
        language: lang,
        rand: 0,
      },
    ])
  );

const queryBySharedId = async (tenantClient: TenantAwareESClient, sharedId: string) =>
  tenantClient.search<EntityElasticDocument>({
    alias: EntityIndexMappingDefinition.alias,
    query: { term: { sharedId } },
  });

const toMapped = (entities: EntityDBO[], slotMap: SlotMap = createSlotMap()): MappedDocument[] =>
  EntityElasticDocumentMapper.toDocuments(entities, slotMap);

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

  const sut = new EntityESWriter({ esClient: tenantClient });

  return { sut, tenantClient };
};

describe('EntityESWriter', () => {
  jest.setTimeout(30_000);
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

  describe('index()', () => {
    it('two variants of the same sharedId produce exactly one ES document', async () => {
      const { sut, tenantClient } = createSut('tenant-a');

      await sut.index(
        toMapped(
          [createEntity('shared-1', 'en', 'hello'), createEntity('shared-1', 'es', 'hola')],
          createSlotMap(['en', 'es'])
        ),
        true
      );

      const result = await tenantClient.search<EntityElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { match_all: {} },
      });

      expect(result.hits.hits).toHaveLength(1);
    });

    it('ES document is stored under id tenantId__sharedId with tenant routing', async () => {
      const { sut, tenantClient } = createSut('tenant-a');
      const entityEn = createEntity('shared-1', 'en', 'hello');
      const entityEs = createEntity('shared-1', 'es', 'hola');

      await sut.index(toMapped([entityEn, entityEs], createSlotMap(['en', 'es'])), true);

      const result = await tenantClient.search<EntityElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { match_all: {} },
      });

      expect(result.hits.hits[0]._id).toBe('tenant-a__shared-1');
      expect(result.hits.hits[0]._routing).toBe('tenant-a');
    });

    it('rawEntities contains one entry per language variant', async () => {
      const { sut, tenantClient } = createSut('tenant-a');
      const templateId = new ObjectId();
      const entityEn = createEntity('shared-1', 'en', 'hello', templateId);
      const entityEs = createEntity('shared-1', 'es', 'hola', templateId);

      await sut.index(toMapped([entityEn, entityEs], createSlotMap(['en', 'es'])), true);

      const [hit] = (
        await tenantClient.search<EntityElasticDocument>({
          alias: EntityIndexMappingDefinition.alias,
          query: { match_all: {} },
        })
      ).hits.hits;

      const source = hit._source as any;
      expect(source.rawEntities).toMatchObject({
        en: { sharedId: 'shared-1', language: 'en', title: 'Title en' },
        es: { sharedId: 'shared-1', language: 'es', title: 'Title es' },
      });
      expect(source).not.toHaveProperty('rawEntity');
      expect(source).not.toHaveProperty('language');
      expect(source).not.toHaveProperty('title');
    });

    it('translatable metadata slots contain per-language values', async () => {
      const { sut, tenantClient } = createSut('tenant-a');

      await sut.index(
        toMapped(
          [createEntity('shared-1', 'en', 'hello'), createEntity('shared-1', 'es', 'hola')],
          createSlotMap(['en', 'es'])
        ),
        true
      );

      const [hit] = (
        await tenantClient.search<EntityElasticDocument>({
          alias: EntityIndexMappingDefinition.alias,
          query: { match_all: {} },
        })
      ).hits.hits;

      expect(hit._source!.metadata).toMatchObject({
        txt_01: ['hello'],
        txt_02: ['hola'],
      });
    });

    it('flat input mixing two different sharedId values produces two ES documents', async () => {
      const { sut, tenantClient } = createSut('tenant-a');

      await sut.index(
        toMapped(
          [
            createEntity('shared-aaa', 'en', 'foo'),
            createEntity('shared-bbb', 'en', 'bar'),
            createEntity('shared-aaa', 'es', 'fuu'),
          ],
          createSlotMap(['en', 'es'])
        ),
        true
      );

      const result = await tenantClient.search<EntityElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: { match_all: {} },
      });

      expect(result.hits.hits).toHaveLength(2);
      expect(result.hits.hits.map(h => h._source!.sharedId).sort()).toEqual([
        'shared-aaa',
        'shared-bbb',
      ]);
    });

    it('is a no-op for empty input', async () => {
      const { sut } = createSut('tenant-a');

      await sut.index([]);

      const result = await esClient.search({
        index: indexName,
        body: { query: { match_all: {} } },
      });

      expect((result.body as any).hits.hits).toHaveLength(0);
    });

    describe('re-indexing an existing document', () => {
      it('preserves created_at and refreshes updated_at', async () => {
        const { sut, tenantClient } = createSut('tenant-a');
        const entity = createEntity('shared-reindex', 'en', 'original');

        await sut.index(toMapped([entity]), true);

        const first = await queryBySharedId(tenantClient, 'shared-reindex');
        const firstCreatedAt = first.hits.hits[0]._source!.created_at;
        const firstUpdatedAt = first.hits.hits[0]._source!.updated_at;

        // Brief pause so the second ingest timestamp is strictly later
        // eslint-disable-next-line no-promise-executor-return
        await new Promise(resolve => setTimeout(resolve, 200));

        await sut.index(toMapped([{ ...entity, title: 'Updated title' }]), true);

        const second = await queryBySharedId(tenantClient, 'shared-reindex');
        const secondSource = second.hits.hits[0]._source!;

        expect(secondSource.created_at).toBe(firstCreatedAt);
        expect(secondSource.updated_at).not.toBe(firstUpdatedAt);
      });

      it('reflects updated field values in rawEntities', async () => {
        const { sut, tenantClient } = createSut('tenant-a');
        const entity = createEntity('shared-update', 'en', 'original text');

        await sut.index(toMapped([entity]), true);
        await sut.index(toMapped([{ ...entity, title: 'Updated Title' }]), true);

        const result = await queryBySharedId(tenantClient, 'shared-update');

        expect((result.hits.hits[0]._source as any).rawEntities.en.title).toBe('Updated Title');
      });

      it('removes metadata values no longer present in the entity', async () => {
        const { sut, tenantClient } = createSut('tenant-a');
        const entity = createEntity('shared-metadata-remove', 'en', 'to be removed');

        await sut.index(toMapped([entity]), true);
        const before = await queryBySharedId(tenantClient, 'shared-metadata-remove');
        expect(before.hits.hits[0]._source!.metadata).toEqual({ txt_01: ['to be removed'] });

        await sut.index(toMapped([{ ...entity, metadata: {} }]), true);

        const after = await queryBySharedId(tenantClient, 'shared-metadata-remove');
        expect(after.hits.hits[0]._source!.metadata).toEqual({});
      });
    });
  });

  describe('deleteBySharedIds()', () => {
    it('issues tenant-routed deleteByQuery by sharedIds', async () => {
      const { sut, tenantClient } = createSut('tenant-a');

      await sut.index(
        toMapped(
          [
            createEntity('shared-delete', 'en', 'delete en'),
            createEntity('shared-delete', 'es', 'delete es'),
            createEntity('shared-keep', 'en', 'keep en'),
          ],
          createSlotMap(['en', 'es'])
        ),
        true
      );

      await sut.deleteBySharedIds(['shared-delete'], true);

      const result = await tenantClient.search<EntityElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: {
          match_all: {},
        },
      });

      expect(result.hits.hits).toHaveLength(1);
      expect(result.hits.hits[0]._source!.sharedId).toBe('shared-keep');
    });

    it('is a no-op for empty input', async () => {
      const { sut } = createSut('tenant-a');
      await expect(sut.deleteBySharedIds([])).resolves.toBeUndefined();
    });

    it('concurrent deletes of the same sharedId produce a 409 version conflict with "but no document was found"', async () => {
      const { sut } = createSut('tenant-a');

      await sut.index(toMapped([createEntity('shared-concurrent', 'en', 'hello')]), true);

      const results = await Promise.allSettled([
        sut.deleteBySharedIds(['shared-concurrent'], true),
        sut.deleteBySharedIds(['shared-concurrent'], true),
      ]);

      const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason.statusCode).toBe(409);
      expect(rejected[0].reason.message).toContain('but no document was found');
    });
  });

  describe('deleteByTemplateIds()', () => {
    it('issues tenant-routed deleteByQuery by templateIds', async () => {
      const { sut, tenantClient } = createSut('tenant-a');
      const templateToDelete = new ObjectId();
      const templateToKeep = new ObjectId();

      await sut.index(
        toMapped(
          [
            createEntity('shared-1', 'en', 'delete en', templateToDelete),
            createEntity('shared-1', 'es', 'delete es', templateToDelete),
            createEntity('shared-2', 'en', 'keep en', templateToKeep),
          ],
          createSlotMap(['en', 'es'])
        ),
        true
      );

      await sut.deleteByTemplateIds([templateToDelete.toString()], true);

      const result = await tenantClient.search<EntityElasticDocument>({
        alias: EntityIndexMappingDefinition.alias,
        query: {
          match_all: {},
        },
      });

      expect(result.hits.hits).toHaveLength(1);
      expect(result.hits.hits[0]._source!.template).toBe(templateToKeep.toString());
    });

    it('is a no-op for empty input', async () => {
      const { sut } = createSut('tenant-a');

      await sut.index(toMapped([createEntity('shared-1', 'en', 'keep en')]), true);

      await sut.deleteByTemplateIds([], true);

      const result = await esClient.search({
        index: indexName,
        body: { query: { match_all: {} } },
      });

      expect((result.body as any).hits.hits).toHaveLength(1);
    });
  });
});
