import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { tenants } from '#api/tenants/index.js';
import { DeleteLanguageEntitiesJobFactory } from '#api/core/infrastructure/factories/DeleteLanguageEntitiesJobFactory.js';
import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { search } from '#api/search/index.js';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  templates: [f.template('template1')],
  entities: [
    ...f.entityInMultipleLanguages(['en', 'es'], 'entity1', 'template1'),
    ...f.entityInMultipleLanguages(['en', 'es'], 'entity2', 'template1'),
  ],
};

const heartbeat = jest.fn();

const createSUT = (mockWebSockets: jest.Mocked<WebSockets>) =>
  testingEnvironment.runWithContext(() =>
    DeleteLanguageEntitiesJobFactory.default({
      webSockets: mockWebSockets,
    })
  );

const dispatch = async (job: ReturnType<typeof createSUT>, language: string) =>
  job.handleDispatch(heartbeat, { language } as any, {
    namespace: tenants.current().name,
    maxRetries: 3,
    retryCount: 0,
  });

describe('DeleteLanguageEntitiesJob', () => {
  let mockWebSockets: jest.Mocked<WebSockets>;

  beforeEach(async () => {
    mockWebSockets = { emitToTenant: jest.fn(), emitToTenantAdmins: jest.fn() };
    heartbeat.mockClear();
    jest.spyOn(search, 'deleteLanguage').mockResolvedValue(undefined as any);
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when deleting entities for a language', () => {
    it('should remove all entity documents for the target language', async () => {
      await dispatch(createSUT(mockWebSockets), 'es');

      const remaining = await testingEnvironment.db
        .getCollection('entities')!
        .find({ language: 'es' })
        .toArray();
      expect(remaining).toHaveLength(0);
    });

    it('should leave entities for other languages intact', async () => {
      await dispatch(createSUT(mockWebSockets), 'es');

      const enEntities = await testingEnvironment.db
        .getCollection('entities')!
        .find({ language: 'en' })
        .toArray();
      expect(enEntities).toHaveLength(2);
    });

    it('should call the V1 search.deleteLanguage', async () => {
      await dispatch(createSUT(mockWebSockets), 'es');

      expect(search.deleteLanguage).toHaveBeenCalledWith('es');
    });

    it('should emit translationsDeleteDone to the tenant', async () => {
      await dispatch(createSUT(mockWebSockets), 'es');

      expect(mockWebSockets.emitToTenant).toHaveBeenCalledWith(
        tenants.current().name,
        'translationsDeleteDone'
      );
    });
  });
});
