import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { LanguagesListSchema } from '#shared/types/commonTypes.js';

import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';
import { PXEntityStatusesQueryServiceFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusesQueryServiceFactory.js';
import { mongoPXEntitiesStatusCollection } from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';

const f = getFixturesFactory();

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const sourceTemplate = f.template('Source Template');
const extractorId = f.id('extractor');

const [entity1En] = f.entityInMultipleLanguages(['en'], 'entity1', sourceTemplate.name);
const [entity2En] = f.entityInMultipleLanguages(['en'], 'entity2', sourceTemplate.name);
const [entity3En] = f.entityInMultipleLanguages(['en'], 'entity3', sourceTemplate.name);

const fileEntity1En = f.document('doc_entity1', { entity: entity1En.sharedId, language: 'en' });
const fileEntity2Pt = f.document('doc_entity2', { entity: entity2En.sharedId, language: 'pt' });

const existingStatusForEntity2 = {
  _id: f.id('status_entity2'),
  entitySharedId: entity2En.sharedId,
  extractorId,
  status: EntityStatus.New,
};

const installedLanguages = [
  { key: 'en', label: 'English', ISO639_3: 'eng' },
  { key: 'pt', label: 'Portuguese', ISO639_3: 'por' },
] as LanguagesListSchema;

const createFixtures = (): DBFixture => ({
  templates: [sourceTemplate],
  entities: [entity1En, entity2En, entity3En],
  files: [fileEntity1En, fileEntity2Pt],
  [mongoPXEntitiesStatusCollection]: [existingStatusForEntity2],
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],
});

const createSut = () =>
  testingEnvironment.runWithContext(() => {
    const connection = getConnection();
    const transactionManager = TransactionManagerFactory.default();

    return {
      sut: PXEntityStatusesQueryServiceFactory.createDefault({
        connection,
        transactionManager,
      }),
    };
  });

describe('PXEntityStatusesQueryService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(createFixtures(), { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: usePostgres } });
      await testingEnvironment.setFixtures(createFixtures());
    });

    it('should return source-template entities with a document in an installed language and no status', async () => {
      const { sut } = createSut();

      const unprocessed = await sut.fetchUnprocessedEntities({
        sourceTemplateId: sourceTemplate._id.toString(),
        extractorId: extractorId.toString(),
        defaultLanguageKey: 'en',
        installedLanguages,
        batchSize: 10,
      });

      expect(unprocessed).toEqual([{ sharedId: entity1En.sharedId }]);
    });

    it('should respect the batch size', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        [mongoPXEntitiesStatusCollection]: [],
      });
      const { sut } = createSut();

      const unprocessed = await sut.fetchUnprocessedEntities({
        sourceTemplateId: sourceTemplate._id.toString(),
        extractorId: extractorId.toString(),
        defaultLanguageKey: 'en',
        installedLanguages,
        batchSize: 1,
      });

      // entity1 (en file) and entity2 (pt file) both match; batch limits to 1.
      expect(unprocessed).toHaveLength(1);
      expect(['entity1', 'entity2']).toContain(unprocessed[0].sharedId);
    });

    it('should not return entities whose document is not in an installed language', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        files: [
          fileEntity1En,
          f.document('doc_entity2', { entity: entity2En.sharedId, language: 'it' }),
        ],
        [mongoPXEntitiesStatusCollection]: [],
      });
      const { sut } = createSut();

      const unprocessed = await sut.fetchUnprocessedEntities({
        sourceTemplateId: sourceTemplate._id.toString(),
        extractorId: extractorId.toString(),
        defaultLanguageKey: 'en',
        installedLanguages,
        batchSize: 10,
      });

      expect(unprocessed).toEqual([{ sharedId: entity1En.sharedId }]);
    });
  });
});
