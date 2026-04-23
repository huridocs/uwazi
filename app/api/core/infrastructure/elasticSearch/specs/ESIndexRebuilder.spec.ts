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
import { EntityIndexerService } from '../entities/EntityIndexerService.js';
import { FullTextIndexerService } from '../entities/FullTextIndexerService.js';
import { EntityIndexMappingDefinition } from '../entities/EntityIndexMappingDefinition.js';
import { ElasticSearchBootstrapper } from '../provision/ElasticSearchBootstrapper.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { MongoTemplatesDAO } from '../../mongodb/template/MongoTemplatesDAO.js';
import { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO.js';
import { MongoFilesDAO } from '../../mongodb/files/MongoFilesDAO.js';
import { ESIndexRebuilder } from '../ESIndexRebuilder.js';
import type { IndexDefinition } from '../Types.js';

const factory = getFixturesFactory();
const rawESClient = new Client({ node: config.elasticsearch.nodes });

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const testAlias = `test_rebuilder_${runId}`;
const testPhysicalPrefix = `test_rebuilder_${runId}`;
const testTenantName = `test_tenant_${runId}`;

const testRegistry: Record<string, IndexDefinition> = {
  entities: {
    alias: testAlias,
    physicalPrefix: testPhysicalPrefix,
    settings: {
      ...EntityIndexMappingDefinition.settings,
      number_of_shards: 1,
      number_of_replicas: 0,
    },
    mappings: EntityIndexMappingDefinition.mappings,
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

const createSut = () => {
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

  const slotsBootstrapper = new MongoSlotsBootstrapper({ database: db });
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

  const entityIndexer = new EntityIndexerService({ esClient: tenantAwareClient, slotsDAO });
  const fullTextIndexer = new FullTextIndexerService({ esClient: tenantAwareClient });
  const entityDAO = new MongoEntityDAO(db, transactionManager);
  const filesDAO = new MongoFilesDAO({ db, transactionManager });

  const esBootstrapper = new ElasticSearchBootstrapper({
    client: rawESClient,
    registry: testRegistry,
    logger: TestUtils.mockClass<Logger>({ info: jest.fn() }),
  });

  const sut = new ESIndexRebuilder({
    esClient: rawESClient,
    esBootstrapper,
    entityIndexer,
    fullTextIndexer,
    slotsBootstrapper,
    slotsReconciler,
    entityDAO,
    filesDAO,
    registry: testRegistry,
    logger: TestUtils.mockClass<Logger>({ info: jest.fn() }),
  });

  return { sut, tenantAwareClient, slotsDAO };
};

const slotsCollection = () => getConnection().collection(MongoSlotsDAO.collectionName);

describe('ESIndexRebuilder', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await deleteTestIndex();
    await testingEnvironment.tearDown();
    await rawESClient.close();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await deleteTestIndex();
    MongoSlotsDAO.clearCache();
  });

  describe('execute()', () => {
    it('entities present in MongoDB are searchable in ES after execute()', async () => {
      const { sut, tenantAwareClient } = createSut();
      await sut.execute();
      await refreshTestIndex();

      const resultA = await tenantAwareClient.search({
        alias: testAlias,
        query: { term: { sharedId: 'entity_a' } },
      });
      const resultB = await tenantAwareClient.search({
        alias: testAlias,
        query: { term: { sharedId: 'entity_b' } },
      });

      expect(resultA.hits.hits).toHaveLength(1);
      expect(resultB.hits.hits).toHaveLength(1);
    });

    it('processed documents with fullText are searchable as full-text in ES after execute()', async () => {
      const { sut, tenantAwareClient } = createSut();
      await sut.execute();
      await refreshTestIndex();

      const result = await tenantAwareClient.search({
        alias: testAlias,
        query: { term: { fullText: 'fullText' } },
      });

      expect(result.hits.hits).toHaveLength(1);
      expect((result.hits.hits[0]._source as any)?.filename).toBe('doc_en');
    });

    it('processing/failed/attachment files are not indexed as full-text in ES', async () => {
      const { sut, tenantAwareClient } = createSut();
      await sut.execute();
      await refreshTestIndex();

      const result = await tenantAwareClient.search({
        alias: testAlias,
        query: { term: { fullText: 'fullText' } },
      });

      const filenames = result.hits.hits.map((h: any) => h._source?.filename);
      expect(filenames).not.toContain('doc_processing');
      expect(filenames).not.toContain('att_en');
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

    it('slots are assigned to template filterable properties after execute()', async () => {
      const { sut } = createSut();
      await sut.execute();

      const assignedSlots = await slotsCollection().find({ assignedTo: 'filter_prop' }).toArray();

      expect(assignedSlots.length).toBeGreaterThan(0);
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
  });
});
