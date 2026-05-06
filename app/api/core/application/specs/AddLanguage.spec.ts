import path from 'path';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { TranslationDBO } from '#api/i18n.v2/schemas/TranslationDBO.js';
import { AddLanguageUseCase } from '#api/core/application/AddLanguage.js';
import { AddLanguageUseCaseFactory } from '#api/core/infrastructure/factories/AddLanguageUseCaseFactory.js';
import { LanguageAddedEvent } from '#api/core/domain/language/events/LanguageAddedEvent.js';
import { DefaultTranslations } from '#api/i18n/defaultTranslations.js';
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
      languages: [{ default: true, key: 'en', label: 'English' }],
    },
  ],
  translationsV2: [
    createTranslationDBO('Search', 'Search', 'en', systemContext),
    createTranslationDBO('Filters', 'Filters', 'en', systemContext),
  ] as TranslationDBO[],
};

const cloneLanguageEntitiesSpy = jest.fn().mockResolvedValue(undefined);
const mockDispatcher = {
  cloneLanguageEntities: cloneLanguageEntitiesSpy,
} as unknown as Dispatcher;

const createSut = (overrides?: Partial<ConstructorParameters<typeof AddLanguageUseCase>[0]>) =>
  testingEnvironment.runWithContext(() =>
    AddLanguageUseCaseFactory.default({ dispatcher: mockDispatcher, ...overrides })
  );

describe('AddLanguage use case', () => {
  beforeEach(async () => {
    cloneLanguageEntitiesSpy.mockClear();
    DefaultTranslations.CONTENTS_DIRECTORY = path.join(
      __dirname,
      '../../../i18n/specs/test_contents/2'
    );
    jest.spyOn(search, 'indexEntities').mockResolvedValue(undefined as any);
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when adding multiple languages', () => {
    it('should persist all new languages in settings and mark them as installing', async () => {
      await createSut().execute({
        languages: [
          { key: 'es', label: 'Spanish' },
          { key: 'zh', label: 'Chinese' },
        ],
      });

      const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
      expect(settings?.languages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'en', label: 'English', default: true }),
          expect.objectContaining({ key: 'es', label: 'Spanish', installing: true }),
          expect.objectContaining({ key: 'zh', label: 'Chinese', installing: true }),
        ])
      );
    });

    it('should clone translations from the default language for each new language', async () => {
      await createSut().execute({
        languages: [
          { key: 'es', label: 'Spanish' },
          { key: 'zh', label: 'Chinese' },
        ],
      });

      const esCount = await testingEnvironment.db
        .getCollection('translationsV2')!
        .countDocuments({ language: 'es' });
      const zhCount = await testingEnvironment.db
        .getCollection('translationsV2')!
        .countDocuments({ language: 'zh' });

      expect(esCount).toBe(2);
      expect(zhCount).toBe(2);
    });

    it('should import predefined translations when a CSV is available for a locale', async () => {
      await createSut().execute({
        languages: [
          { key: 'es', label: 'Spanish' }, // has CSV in test_contents/2
          { key: 'zh', label: 'Chinese' }, // no CSV
        ],
      });

      const esSearch = await testingEnvironment.db.getCollection('translationsV2')!.findOne({
        language: 'es',
        key: 'Search',
        'context.id': 'System',
      });
      expect(esSearch?.value).toBe('Buscar traducida');

      // zh has no CSV — cloned value from en should remain
      const zhSearch = await testingEnvironment.db.getCollection('translationsV2')!.findOne({
        language: 'zh',
        key: 'Search',
        'context.id': 'System',
      });
      expect(zhSearch?.value).toBe('Search');
    });

    it('should dispatch CloneLanguageEntities job with all new-language pairs', async () => {
      await createSut().execute({
        languages: [
          { key: 'es', label: 'Spanish' },
          { key: 'zh', label: 'Chinese' },
        ],
      });

      expect(cloneLanguageEntitiesSpy).toHaveBeenCalledWith({
        pairs: [
          { from: 'en', to: 'es' },
          { from: 'en', to: 'zh' },
        ],
      });
    });

    it('should emit a LanguageAddedEvent for each new language', async () => {
      const emitSpy = jest.fn().mockResolvedValue(undefined);
      await createSut({ eventEmitter: { emit: emitSpy } }).execute({
        languages: [
          { key: 'es', label: 'Spanish' },
          { key: 'zh', label: 'Chinese' },
        ],
      });

      const languageAddedCalls = emitSpy.mock.calls.filter(
        ([event]) => event instanceof LanguageAddedEvent
      );
      expect(languageAddedCalls).toHaveLength(2);
      expect(languageAddedCalls[0][0].payload).toMatchObject({
        language: 'es',
        defaultLanguage: 'en',
      });
      expect(languageAddedCalls[1][0].payload).toMatchObject({
        language: 'zh',
        defaultLanguage: 'en',
      });
    });

    it('should skip already-installed languages and only process new ones', async () => {
      const emitSpy = jest.fn().mockResolvedValue(undefined);
      // 'en' is already installed; only 'es' is new
      await createSut({ eventEmitter: { emit: emitSpy }, dispatcher: mockDispatcher }).execute({
        languages: [
          { key: 'en', label: 'English' }, // already installed
          { key: 'es', label: 'Spanish' }, // new
        ],
      });

      // Only one event for the new language
      const languageAddedCalls = emitSpy.mock.calls.filter(
        ([event]) => event instanceof LanguageAddedEvent
      );
      expect(languageAddedCalls).toHaveLength(1);
      expect(languageAddedCalls[0][0].payload).toMatchObject({ language: 'es' });

      // Job dispatched only for the new language
      expect(cloneLanguageEntitiesSpy).toHaveBeenCalledWith({
        pairs: [{ from: 'en', to: 'es' }],
      });

      // 'en' entry in settings unchanged (no duplicate)
      const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
      const enEntries = settings?.languages?.filter((l: any) => l.key === 'en');
      expect(enEntries).toHaveLength(1);
    });

    it('should do nothing when all requested languages are already installed', async () => {
      const emitSpy = jest.fn().mockResolvedValue(undefined);
      await createSut({ eventEmitter: { emit: emitSpy }, dispatcher: mockDispatcher }).execute({
        languages: [{ key: 'en', label: 'English' }],
      });

      expect(emitSpy).not.toHaveBeenCalled();
      expect(cloneLanguageEntitiesSpy).not.toHaveBeenCalled();
    });
  });
});
