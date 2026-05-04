/* eslint-disable max-statements */
import { Client } from '@elastic/elasticsearch';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { config } from '#api/config.js';
import { DBFixture } from '#api/utils/testing_db.js';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { MongoSlotsDAO } from '../entities/MongoSlotsDAO.js';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';
import { SlotsReconciler } from '../entities/SlotsReconciler.js';
import { EntityESWriter } from '../entities/EntityESWriter.js';
import { FullTextESWriter } from '../entities/FullTextESWriter.js';
import { EntityIndexerService } from '../entities/EntityIndexerService.js';
import { FullTextIndexerService } from '../entities/FullTextIndexerService.js';
import { EntityIndexMappingDefinition } from '../entities/EntityIndexMappingDefinition.js';
import { createEntityMetadataMapping } from '../entities/EntityMetadataMapping.js';
import type { SlotType } from '../entities/SlotType.js';
import { ElasticSearchBootstrapper } from '../provision/ElasticSearchBootstrapper.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { MongoTemplatesDAO } from '../../mongodb/template/MongoTemplatesDAO.js';
import { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO.js';
import { MongoFilesDAO } from '../../mongodb/files/MongoFilesDAO.js';
import { ESIndexRebuilder, ESIndexRebuilderDeps, ProgressEvent } from '../ESIndexRebuilder.js';
import type { IndexDefinition } from '../Types.js';
import { User } from '#api/users.v2/model/User.js';

const factory = getFixturesFactory();
const rawESClient = new Client({ node: config.elasticsearch.nodes });

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const testAlias = `test_rebuilder_${runId}`;
const testPhysicalPrefix = `test_rebuilder_${runId}`;
const testTenantName = `test_tenant_${runId}`;

// Minimal slot counts for tests — enough for 1 filterable text property × 3 languages
const testAmountPerSlotType: Record<SlotType, number> = {
  txt: 5,
  date: 3,
  num: 3,
  range: 3,
  select: 3,
  relationship: 3,
  geolocation: 3,
  relationship_txt: 5,
  relationship_num: 3,
  relationship_date: 3,
  relationship_range: 3,
  relationship_select: 3,
  relationship_geolocation: 3,
};

const testRegistry: Record<string, IndexDefinition> = {
  entities: {
    alias: testAlias,
    physicalPrefix: testPhysicalPrefix,
    settings: {
      ...EntityIndexMappingDefinition.settings,
      number_of_shards: 1,
      number_of_replicas: 0,
    },
    mappings: {
      ...EntityIndexMappingDefinition.mappings,
      properties: {
        ...EntityIndexMappingDefinition.mappings.properties,
        metadata: { properties: createEntityMetadataMapping(testAmountPerSlotType) },
      },
    },
  } as IndexDefinition,
};

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en' as LanguageISO6391, label: 'English', default: true }] }],
  templates: [
    factory.template('template_a', [
      factory.property('filter_prop', 'text', { filter: true }),
      factory.property('plain_prop', 'text'),
    ]),
  ],
  entities: [
    factory.entity('entity_a', 'template_a', {}, { language: 'en', published: true }),
    factory.entity('entity_b', 'template_a', {}, { language: 'en', published: true }),
  ],
  files: [
    factory.document('doc_en', {
      entity: 'entity_a',
      language: 'en',
      status: 'ready',
      fullText: { 1: 'searchable content' },
    }),
    factory.document('doc_processing', { entity: 'entity_b', status: 'processing' }),
    factory.attachment('att_en', { entity: 'entity_a' }),
  ],
};

const deleteTestIndex = async () =>
  rawESClient.indices.delete({
    index: `${testPhysicalPrefix}_v1`,
    ignore_unavailable: true,
  });

const refreshTestIndex = async () => rawESClient.indices.refresh({ index: testAlias });

const createSut = (deps?: Partial<ESIndexRebuilderDeps>) => {
  const transactionManager = TransactionManagerFactory.default() as MongoTransactionManager;
  const db = getConnection();

  const templatesDAO = new MongoTemplatesDAO({ db, transactionManager });
  const slotsDAO = new MongoSlotsDAO({
    db,
    transactionManager,
    tenantName: testTenantName,
    settingsDS: TestUtils.mockClass<SettingsDataSource>({
      getInstalledLanguages: async () => [{ key: 'en' as LanguageISO6391, label: 'English' }],
    }),
  });

  const slotsBootstrapper = new MongoSlotsBootstrapper({
    database: db,
    amountPerSlotType: testAmountPerSlotType,
  });
  const slotsReconciler = new SlotsReconciler({ slotsDAO, templatesDAO });

  const resolver = TestUtils.mockClass<IndexNameResolver>({
    resolve: jest.fn().mockResolvedValue(testAlias),
    invalidate: jest.fn(),
  });

  const tenantAwareClient = new TenantAwareESClient({
    client: rawESClient,
    resolver,
    tenantId: testTenantName,
  });

  const entityWriter = new EntityESWriter({ esClient: tenantAwareClient });
  const fullTextWriter = new FullTextESWriter({ esClient: tenantAwareClient });
  const entityDAO = new MongoEntityDAO(db, transactionManager, User.createFrom(null));
  const filesDAO = new MongoFilesDAO({ db, transactionManager });

  const entityIndexer = new EntityIndexerService({ writer: entityWriter, entityDAO, slotsDAO });
  const fullTextIndexer = new FullTextIndexerService({ writer: fullTextWriter, filesDAO });

  const esBootstrapper = new ElasticSearchBootstrapper({
    client: rawESClient,
    registry: testRegistry,
    logger: TestUtils.mockClass<Logger>({ info: jest.fn() }),
  });

  const sut = new ESIndexRebuilder({
    transactionManager,
    esClient: rawESClient,
    esBootstrapper,
    entityIndexer,
    fullTextIndexer,
    slotsBootstrapper,
    slotsReconciler,
    registry: testRegistry,
    logger: TestUtils.mockClass<Logger>({ info: jest.fn() }),
    ...deps,
  });

  return { sut, tenantAwareClient, slotsDAO };
};

const slotsCollection = () => getConnection().collection(MongoSlotsDAO.collectionName);

describe('ESIndexRebuilder', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    MongoSlotsDAO.clearCache();
  });

  afterAll(async () => {
    await deleteTestIndex();
    await testingEnvironment.tearDown();
    await rawESClient.close();
  });

  describe('execute()', () => {
    describe('after a single execute() with base fixtures', () => {
      let sharedTenantClient: TenantAwareESClient;

      beforeAll(async () => {
        const { sut, tenantAwareClient } = createSut();
        sharedTenantClient = tenantAwareClient;
        await sut.execute();
        await refreshTestIndex();
      });

      it('entities present in MongoDB are searchable in ES after execute()', async () => {
        const resultA = await sharedTenantClient.search({
          alias: testAlias,
          query: { term: { sharedId: 'entity_a' } },
        });
        const resultB = await sharedTenantClient.search({
          alias: testAlias,
          query: { term: { sharedId: 'entity_b' } },
        });

        expect(resultA.hits.hits).toHaveLength(1);
        expect(resultB.hits.hits).toHaveLength(1);
      });

      it('processed documents with fullText are searchable as full-text in ES after execute()', async () => {
        const result = await sharedTenantClient.search({
          alias: testAlias,
          query: { term: { fullText: 'fullText' } },
        });

        expect(result.hits.hits).toHaveLength(1);
        expect((result.hits.hits[0]._source as any)?.filename).toBe('doc_en');
      });

      it('processing/failed/attachment files are not indexed as full-text in ES', async () => {
        const result = await sharedTenantClient.search({
          alias: testAlias,
          query: { term: { fullText: 'fullText' } },
        });

        const filenames = result.hits.hits.map((h: any) => h._source?.filename);
        expect(filenames).not.toContain('doc_processing');
        expect(filenames).not.toContain('att_en');
      });
    });

    it('slots are assigned to template filterable properties after execute()', async () => {
      const { sut } = createSut();
      await sut.execute();

      const assignedSlots = await slotsCollection().find({ assignedTo: 'filter_prop' }).toArray();

      expect(assignedSlots.length).toBeGreaterThan(0);
    });

    it('stale entities from a previous index build are no longer present after a second execute()', async () => {
      const { sut, tenantAwareClient } = createSut();

      // First build: entity_a and entity_b are indexed
      await sut.execute();
      await refreshTestIndex();

      // Remove entity_b from MongoDB
      await testingEnvironment.setFixtures({
        entities: [
          factory.entity('entity_a', 'template_a', {}, { language: 'en', published: true }),
        ],
      });

      // Second build: only entity_a should be indexed now
      MongoSlotsDAO.clearCache();
      await sut.execute();
      await refreshTestIndex();

      const resultB = await tenantAwareClient.search({
        alias: testAlias,
        query: { term: { sharedId: 'entity_b' } },
      });

      expect(resultB.hits.hits).toHaveLength(0);
    });

    it('stale slot assignments from before execute() are gone after execute()', async () => {
      const { sut } = createSut();

      // First build assigns slots to filter_prop
      await sut.execute();

      // Manually add a stale assignment via raw collection
      await slotsCollection().updateOne(
        { assignedTo: null, language: null },
        { $set: { assignedTo: 'stale_prop', language: 'en' } }
      );

      const beforeCount = await slotsCollection().countDocuments({ assignedTo: 'stale_prop' });
      expect(beforeCount).toBe(1);

      // Second build should wipe and re-seed — stale assignment is gone
      MongoSlotsDAO.clearCache();
      await sut.execute();

      const afterCount = await slotsCollection().countDocuments({ assignedTo: 'stale_prop' });
      expect(afterCount).toBe(0);
    });

    it('a multi-language entity produces a single ES document containing all language variants', async () => {
      await testingEnvironment.setFixtures({
        settings: [
          { languages: [{ key: 'en' as LanguageISO6391, label: 'English', default: true }] },
        ],
        templates: [factory.template('template_a', [])],
        entities: [
          factory.entity('multi_lang', 'template_a', {}, { language: 'en', published: true }),
          factory.entity('multi_lang', 'template_a', {}, { language: 'es', published: true }),
          factory.entity('multi_lang', 'template_a', {}, { language: 'pt', published: true }),

          factory.entity('multi_lang_2', 'template_a', {}, { language: 'en', published: true }),
          factory.entity('multi_lang_2', 'template_a', {}, { language: 'es', published: true }),
          factory.entity('multi_lang_2', 'template_a', {}, { language: 'pt', published: true }),
        ],
      });

      MongoSlotsDAO.clearCache();

      const { sut, tenantAwareClient } = createSut();

      await sut.execute();
      await refreshTestIndex();

      const result = await tenantAwareClient.search({
        alias: testAlias,
        query: { term: { sharedId: 'multi_lang' } },
      });

      expect(result.hits.hits).toHaveLength(1);

      const source = result.hits.hits[0]._source as any;
      expect(source?.rawEntities?.en).toBeDefined();
      expect(source?.rawEntities?.es).toBeDefined();
      expect(source?.rawEntities?.pt).toBeDefined();
    });
  });

  describe('progress events', () => {
    it('emits a merged indexing event with both entity and fulltext counts', async () => {
      const events: ProgressEvent[] = [];
      const { sut } = createSut({ onProgress: e => events.push(e) });

      await sut.execute();

      const stages = events.map(e => e.stage);
      expect(stages).toContain('reset-indexes');
      expect(stages).toContain('reset-slots');
      expect(stages).toContain('reconcile-slots');
      expect(stages).toContain('indexing');
      expect(stages).toContain('done');
      expect(stages).not.toContain('index-entities');
      expect(stages).not.toContain('index-fulltext');

      const indexingEvents = events.filter(
        (e): e is { stage: 'indexing'; entitiesIndexed: number; fullTextIndexed: number } =>
          e.stage === 'indexing'
      );
      expect(indexingEvents.length).toBeGreaterThan(0);

      const last = indexingEvents[indexingEvents.length - 1];
      // fixtures: 2 entities, 1 ready fulltext doc
      expect(last.entitiesIndexed).toBe(2);
      expect(last.fullTextIndexed).toBe(1);
    });
  });

  describe('production guard', () => {
    let originalEnvironment: string;

    beforeEach(() => {
      originalEnvironment = config.ENVIRONMENT;
    });

    afterEach(() => {
      (config as any).ENVIRONMENT = originalEnvironment;
    });

    it('execute() throws if ENVIRONMENT is production', async () => {
      (config as any).ENVIRONMENT = 'production';
      const { sut } = createSut();
      await expect(sut.execute()).rejects.toThrow(
        'ESIndexRebuilder.execute() is not allowed in production'
      );
    });
  });
});
