/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
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
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { MongoTemplatesDAO } from '../../mongodb/template/MongoTemplatesDAO.js';
import { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO.js';
import { MongoFilesDAO } from '../../mongodb/files/MongoFilesDAO.js';
import { TenantOnboarder, TenantOnboarderDeps, ProgressEvent } from '../TenantOnboarder.js';
import { User } from '#api/users.v2/model/User.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';

const factory = getFixturesFactory();
const rawESClient = new Client({ node: config.elasticsearch.nodes });

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const testAlias = `test_onboarder_${runId}`;
const testPhysicalPrefix = `test_onboarder_${runId}`;
const testTenantName = `test_tenant_onboarder_${runId}`;

const testIndexDefinition = {
  alias: testAlias,
  physicalPrefix: testPhysicalPrefix,
  settings: {
    ...EntityIndexMappingDefinition.settings,
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: EntityIndexMappingDefinition.mappings,
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
    factory.entity('entity_c', 'template_a', {}, { language: 'en', published: true }),
  ],
  files: [
    factory.document('doc_en', {
      entity: 'entity_a',
      language: 'en',
      status: 'ready',
      fullText: { 1: 'searchable content' },
    }),
    factory.document('doc_en2', {
      entity: 'entity_b',
      language: 'en',
      status: 'ready',
      fullText: { 1: 'second doc content' },
    }),
    factory.document('doc_processing', { entity: 'entity_b', status: 'processing' }),
    factory.attachment('att_en', { entity: 'entity_a' }),
  ],
};

const createTestIndex = async () => {
  await rawESClient.indices.create({
    index: `${testPhysicalPrefix}_v1`,
    body: {
      settings: testIndexDefinition.settings,
      mappings: testIndexDefinition.mappings,
      aliases: { [testAlias]: {} },
    },
  });
};

const deleteTestIndex = async () =>
  rawESClient.indices.delete({
    index: `${testPhysicalPrefix}_v1`,
    ignore_unavailable: true,
  });

const refreshTestIndex = async () => rawESClient.indices.refresh({ index: testAlias });

const createSut = (deps?: Partial<TenantOnboarderDeps>) => {
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

  const slotsBootstrapper = new MongoSlotsBootstrapper({ database: db, slotsDAO });
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

  const sut = new TenantOnboarder({
    entityIndexer,
    fullTextIndexer,
    slotsBootstrapper,
    slotsReconciler,
    transactionManager,
    logger: TestUtils.mockClass<Logger>({ info: jest.fn() }),
    ...deps,
  });

  return { sut, tenantAwareClient, slotsDAO };
};

const slotsCollection = () => getConnection().collection(MongoSlotsDAO.collectionName);

const resetState = async () => {
  await testingEnvironment.setFixtures(fixtures);
  MongoSlotsDAO.clearCache();
  await rawESClient.deleteByQuery({
    index: testAlias,
    conflicts: 'proceed',
    body: { query: { match_all: {} } },
    refresh: true,
  });
  await slotsCollection()
    .drop()
    .catch(() => {});
};

describe('TenantOnboarder', () => {
  jest.setTimeout(30_000);
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    await createTestIndex();
  });

  afterAll(async () => {
    await deleteTestIndex();
    await testingEnvironment.tearDown();
    await rawESClient.close();
  });

  describe('execute()', () => {
    describe('after a single execute()', () => {
      let tenantAwareClient: TenantAwareESClient;

      beforeAll(async () => {
        await resetState();
        const result = createSut();
        tenantAwareClient = result.tenantAwareClient;
        await result.sut.execute();
        await refreshTestIndex();
      });

      it('entities present in MongoDB are searchable in ES', async () => {
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

      it('processed documents are searchable as full-text', async () => {
        const result = await tenantAwareClient.search({
          alias: testAlias,
          query: { term: { fullText: 'fullText' } },
        });

        const filenames = result.hits.hits.map((h: any) => h._source?.filename).sort();
        expect(filenames).toEqual(['doc_en', 'doc_en2']);
      });

      it('files with status processing or type attachment are not indexed as full-text', async () => {
        const result = await tenantAwareClient.search({
          alias: testAlias,
          query: { term: { fullText: 'fullText' } },
        });

        const filenames = result.hits.hits.map((h: any) => h._source?.filename);
        expect(filenames).not.toContain('doc_processing');
        expect(filenames).not.toContain('att_en');
      });

      it('slots are bootstrapped and assigned to filterable template properties', async () => {
        const assignedSlots = await slotsCollection().find({ assignedTo: 'filter_prop' }).toArray();
        expect(assignedSlots.length).toBeGreaterThan(0);
      });

      it('plain (non-filterable) properties are not assigned a slot', async () => {
        const assignedToPlain = await slotsCollection()
          .find({ assignedTo: 'plain_prop' })
          .toArray();
        expect(assignedToPlain).toHaveLength(0);
      });
    });

    describe('idempotency', () => {
      beforeEach(resetState);

      it('slot document _id is stable across two execute() calls — slotsBootstrapper.execute() is idempotent (no drop)', async () => {
        const { sut } = createSut();

        await sut.execute();
        const slotAfterFirst = await slotsCollection().findOne({ assignedTo: 'filter_prop' });
        expect(slotAfterFirst).not.toBeNull();
        const firstId = slotAfterFirst!._id.toString();

        await sut.execute();
        const slotAfterSecond = await slotsCollection().findOne({ assignedTo: 'filter_prop' });
        expect(slotAfterSecond).not.toBeNull();
        expect(slotAfterSecond!._id.toString()).toBe(firstId);
      });
    });

    describe('resumeFrom', () => {
      beforeEach(resetState);

      it('execute({ entitySharedId }) skips entities up to and including the checkpoint', async () => {
        const events: ProgressEvent[] = [];
        const { sut } = createSut({ onProgress: e => events.push(e) });

        // entity_a < entity_b < entity_c — resume after entity_b means only entity_c is indexed
        await sut.execute({ entitySharedId: 'entity_b' });

        const entityEvents = events.filter(e => e.stage === 'indexing') as Extract<
          ProgressEvent,
          { stage: 'indexing' }
        >[];
        const totalIndexed =
          entityEvents.length > 0 ? entityEvents[entityEvents.length - 1].entitiesIndexed : 0;
        expect(totalIndexed).toBe(1); // only entity_c (1 language doc)
      });

      it('execute({ fileId }) skips fulltext files up to and including the checkpoint', async () => {
        const readyFiles = await getConnection()
          .collection('files')
          .find({ type: 'document', status: 'ready' })
          .sort({ _id: 1 })
          .toArray();
        expect(readyFiles).toHaveLength(2);
        const firstFileId = readyFiles[0]._id as unknown as ObjectId;

        const events: ProgressEvent[] = [];
        const { sut } = createSut({ onProgress: e => events.push(e) });
        await sut.execute({ fileId: firstFileId });

        const fulltextEvents = events.filter(e => e.stage === 'indexing') as Extract<
          ProgressEvent,
          { stage: 'indexing' }
        >[];
        const totalIndexed =
          fulltextEvents.length > 0 ? fulltextEvents[fulltextEvents.length - 1].fullTextIndexed : 0;
        expect(totalIndexed).toBe(1); // only the second ready doc
      });

      it('a full resume-from-both-checkpoints run produces the correct final ES state', async () => {
        const { sut: sut1, tenantAwareClient } = createSut();

        // Full run: index everything
        await sut1.execute();
        await refreshTestIndex();

        // Simulate that entity_c was not indexed (e.g. process died after entity_b)
        await rawESClient.deleteByQuery({
          index: testAlias,
          conflicts: 'proceed',
          body: { query: { term: { sharedId: 'entity_c' } } },
          refresh: true,
        });

        const beforeResume = await tenantAwareClient.search({
          alias: testAlias,
          query: { term: { sharedId: 'entity_c' } },
        });
        expect(beforeResume.hits.hits).toHaveLength(0);

        // Resume run: picks up entity_c
        const { sut: sut2 } = createSut();
        await sut2.execute({ entitySharedId: 'entity_b' });
        await refreshTestIndex();

        // All 3 entities must now be searchable
        await ArrayUtils.parallelFor(['entity_a', 'entity_b', 'entity_c'], async sharedId => {
          const result = await tenantAwareClient.search({
            alias: testAlias,
            query: { term: { sharedId } },
          });
          expect(result.hits.hits).toHaveLength(1);
        });
      });
    });
  });
});
