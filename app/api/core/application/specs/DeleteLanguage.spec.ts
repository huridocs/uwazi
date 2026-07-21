import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { TranslationDBO } from '#api/i18n.v2/schemas/TranslationDBO.js';
import { DeleteLanguageUseCase } from '#api/core/application/DeleteLanguage.js';
import { DeleteLanguageUseCaseFactory } from '#api/core/infrastructure/factories/DeleteLanguageUseCaseFactory.js';
import { LanguageDeletedEvent } from '#api/core/domain/language/events/LanguageDeletedEvent.js';
import { search } from '#api/search/index.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';

jest.mock('#api/core/infrastructure/services/V1WebSocketsWrapper.js', () => ({
  V1WebSocketsWrapper: jest.fn().mockImplementation(() => ({
    emitToTenant: jest.fn(),
    emitToTenantAdmins: jest.fn(),
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

const createSut = (overrides?: Partial<ConstructorParameters<typeof DeleteLanguageUseCase>[0]>) =>
  testingEnvironment.runWithContext(() =>
    DeleteLanguageUseCaseFactory.default({
      dispatcher: mockDispatcher,
      ...overrides,
    })
  );

describe('DeleteLanguage use case', () => {
  beforeEach(async () => {
    deleteLanguageEntitiesSpy.mockClear();
    jest.spyOn(search, 'deleteLanguage').mockResolvedValue(undefined as any);
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
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

      const count = await testingEnvironment.db
        .getCollection('translationsV2')!
        .countDocuments({ language: 'es' });
      expect(count).toBe(0);
    });

    it('should leave translations for other languages intact', async () => {
      await createSut().execute({ key: 'es' });

      const enCount = await testingEnvironment.db
        .getCollection('translationsV2')!
        .countDocuments({ language: 'en' });
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
