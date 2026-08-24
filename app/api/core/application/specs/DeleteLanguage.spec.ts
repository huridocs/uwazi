import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { TranslationDBO } from '#api/core/infrastructure/mongodb/translation/schemas/TranslationDBO.js';
import { DeleteLanguageUseCase } from '#api/core/application/DeleteLanguage.js';
import { DeleteLanguageUseCaseFactory } from '#api/core/infrastructure/factories/DeleteLanguageUseCaseFactory.js';
import { LanguageDeletedEvent } from '#api/core/domain/language/events/LanguageDeletedEvent.js';
import { search } from '#api/search/index.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

jest.mock('#api/core/infrastructure/services/V1WebSocketsWrapper.js', () => ({
  V1WebSocketsWrapper: jest.fn().mockImplementation(() => ({
    emitToTenant: jest.fn(),
    emitToTenantAdmins: jest.fn(),
    emitToTenantAdminsAndEditors: jest.fn(),
    emitToSession: jest.fn(),
  })),
}));

const f = getFixturesFactory();
const createTranslationDBO = f.v2.database.translationDBO;

const systemContext = {
  id: 'System',
  type: 'Uwazi UI' as const,
  label: 'User Interface',
};

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
        { key: 'fr', label: 'French' },
      ],
    },
  ],
  translationsV2: [
    createTranslationDBO('Search', 'Search', 'en', systemContext),
    createTranslationDBO('Search', 'Buscar', 'es', systemContext),
    createTranslationDBO('Search', 'Rechercher', 'fr', systemContext),
  ] as TranslationDBO[],
};

const deleteLanguageEntitiesSpy = jest.fn().mockResolvedValue(undefined);
const mockDispatcher = {
  deleteLanguageEntities: deleteLanguageEntitiesSpy,
} as unknown as Dispatcher;

const testConfigs = [
  { name: 'Mongo', postgresTranslations: false },
  { name: 'Postgres', postgresTranslations: true },
];

describe('DeleteLanguage use case', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresTranslations }) => {
    const withFlag = <T>(fn: () => T) =>
      testingEnvironment.runWithContext(
        fn,
        postgresTranslations
          ? {
              tenant: {
                ...testingTenants.current(),
                featureFlags: { postgresTranslations: true },
              },
            }
          : undefined
      );

    const createSut = (
      overrides?: Partial<ConstructorParameters<typeof DeleteLanguageUseCase>[0]>
    ) =>
      withFlag(() =>
        DeleteLanguageUseCaseFactory.default({
          dispatcher: mockDispatcher,
          ...overrides,
        })
      );

    beforeEach(async () => {
      deleteLanguageEntitiesSpy.mockClear();
      jest.spyOn(search, 'deleteLanguage').mockResolvedValue(undefined as any);
      await testingEnvironment.setFixtures(fixtures);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('when deleting an installed language', () => {
      it('should remove the language from settings', async () => {
        await createSut().execute({ key: 'es' });

        const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
        const keys = settings?.languages?.map((l: any) => l.key);
        expect(keys).not.toContain('es');
        expect(keys).toContain('en');
        expect(keys).toContain('fr');
      });

      it('should remove translations for the deleted language', async () => {
        await createSut().execute({ key: 'es' });

        const count = (
          await withFlag(async () =>
            TranslationsDataSourceFactory.default({
              transactionManager: TransactionManagerFactory.default(),
            }).getByLanguage('es')
          )
        ).length;
        expect(count).toBe(0);
      });

      it('should leave translations for other languages intact', async () => {
        await createSut().execute({ key: 'es' });

        const enCount = (
          await withFlag(async () =>
            TranslationsDataSourceFactory.default({
              transactionManager: TransactionManagerFactory.default(),
            }).getByLanguage('en')
          )
        ).length;
        expect(enCount).toBeGreaterThan(0);
      });

      it('should dispatch DeleteLanguageEntities job for the language', async () => {
        await createSut().execute({ key: 'es' });

        expect(deleteLanguageEntitiesSpy).toHaveBeenCalledWith({ language: 'es' });
      });

      it('should emit a LanguageDeletedEvent for the language', async () => {
        const emitSpy = jest.fn().mockResolvedValue(undefined);
        await createSut({ eventEmitter: { emit: emitSpy } }).execute({ key: 'es' });

        const deletedCalls = emitSpy.mock.calls.filter(
          ([event]) => event instanceof LanguageDeletedEvent
        );
        expect(deletedCalls).toHaveLength(1);
        expect(deletedCalls[0][0].payload).toMatchObject({ language: 'es' });
      });
    });

    describe('when trying to delete the default language', () => {
      it('should throw an error and not remove anything', async () => {
        await expect(createSut().execute({ key: 'en' })).rejects.toThrow(
          'Cannot delete the default language.'
        );

        const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
        expect(settings?.languages?.map((l: any) => l.key)).toContain('en');
      });
    });
  });
});
