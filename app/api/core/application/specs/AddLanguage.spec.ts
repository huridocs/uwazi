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

  describe('when adding a single language', () => {
    it('should persist the new language in settings', async () => {
      await createSut().execute({ languages: [{ key: 'es', label: 'Spanish' }] });

      const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
      expect(settings?.languages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'en', label: 'English', default: true }),
          expect.objectContaining({ key: 'es', label: 'Spanish' }),
        ])
      );
    });

    it('should clone translations from the default language', async () => {
      await createSut().execute({ languages: [{ key: 'es', label: 'Spanish' }] });

      const cloned = await testingEnvironment.db
        .getCollection('translationsV2')!
        .find({ language: 'es' })
        .toArray();

      expect(cloned.length).toBe(2);
      expect(cloned).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'Search', language: 'es' }),
          expect.objectContaining({ key: 'Filters', language: 'es' }),
        ])
      );
    });

    it('should import predefined translations when a CSV is available for the locale', async () => {
      await createSut().execute({ languages: [{ key: 'es', label: 'Spanish' }] });

      const updated = await testingEnvironment.db.getCollection('translationsV2')!.findOne({
        language: 'es',
        key: 'Search',
        'context.id': 'System',
      });

      expect(updated?.value).toBe('Buscar traducida');
    });

    it('should complete without error when no predefined CSV exists for the locale', async () => {
      await expect(
        createSut().execute({ languages: [{ key: 'zh', label: 'Chinese' }] })
      ).resolves.not.toThrow();

      const cloned = await testingEnvironment.db
        .getCollection('translationsV2')!
        .find({ language: 'zh' })
        .toArray();
      expect(cloned.length).toBe(2);
    });

    it('should dispatch CloneLanguageEntities job with the correct pairs', async () => {
      await createSut().execute({ languages: [{ key: 'es', label: 'Spanish' }] });

      expect(cloneLanguageEntitiesSpy).toHaveBeenCalledWith({
        pairs: [{ from: 'en', to: 'es' }],
      });
    });

    it('should emit a LanguageAddedEvent with the correct payload', async () => {
      const emitSpy = jest.fn().mockResolvedValue(undefined);
      await createSut({ eventEmitter: { emit: emitSpy } }).execute({
        languages: [{ key: 'es', label: 'Spanish' }],
      });

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ language: 'es', defaultLanguage: 'en' }),
        })
      );
      expect(emitSpy.mock.calls[0][0]).toBeInstanceOf(LanguageAddedEvent);
    });
  });

  describe('when adding multiple languages', () => {
    it('should persist all new languages in settings', async () => {
      await createSut().execute({
        languages: [
          { key: 'es', label: 'Spanish' },
          { key: 'zh', label: 'Chinese' },
        ],
      });

      const settings = await testingEnvironment.db.getCollection('settings')!.findOne({});
      expect(settings?.languages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'en' }),
          expect.objectContaining({ key: 'es' }),
          expect.objectContaining({ key: 'zh' }),
        ])
      );
    });

    it('should clone translations for each new language', async () => {
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

    it('should emit a LanguageAddedEvent for each language', async () => {
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
    });
  });
});
