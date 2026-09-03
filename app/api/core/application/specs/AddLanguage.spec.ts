/* eslint-disable max-statements, max-lines */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { TranslationDBO } from '#api/core/infrastructure/mongodb/translation/schemas/TranslationDBO.js';
import { AddLanguageUseCase } from '#api/core/application/AddLanguage.js';
import { AddLanguageUseCaseFactory } from '#api/core/infrastructure/factories/AddLanguageUseCaseFactory.js';
import { LanguageAddedEvent } from '#api/core/domain/language/events/LanguageAddedEvent.js';
import { search } from '#api/search/index.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { ImportPredefinedTranslations } from '#api/core/application/translation/ImportPredefinedTranslationsService.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import {
  languageBackendConfigs,
  languageBackendPostgresMirror,
  withLanguageBackendFlags,
} from './languageBackendTest.js';

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

const importPredefinedSpy = jest.fn().mockResolvedValue(undefined);
const mockImportPredefinedTranslations: ImportPredefinedTranslations = {
  execute: importPredefinedSpy,
};

describe('AddLanguage use case', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(languageBackendConfigs)('$name', ({ postgresSettings, postgresTranslations }) => {
    const withFlag = <T>(fn: () => T) =>
      withLanguageBackendFlags(postgresSettings, postgresTranslations, fn);

    const readLanguages = async () =>
      withFlag(async () => (await SettingsDataSourceFactory.default().get()).languages ?? []);

    const createSut = (overrides?: Partial<ConstructorParameters<typeof AddLanguageUseCase>[0]>) =>
      withFlag(() =>
        AddLanguageUseCaseFactory.default({
          dispatcher: mockDispatcher,
          importPredefinedTranslations: mockImportPredefinedTranslations,
          ...overrides,
        })
      );

    beforeEach(async () => {
      cloneLanguageEntitiesSpy.mockClear();
      importPredefinedSpy.mockClear();
      jest.spyOn(search, 'indexEntities').mockResolvedValue(undefined as any);
      await testingEnvironment.setUp(fixtures, {
        postgres: true,
        postgresMirror: languageBackendPostgresMirror(postgresSettings, postgresTranslations),
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('when adding multiple languages', () => {
      it('should persist all new languages in settings and mark them as installing', async () => {
        await createSut().execute({
          languages: [
            { key: 'es', label: 'Spanish' },
            { key: 'zh', label: 'Chinese' },
          ],
        });

        const languages = await readLanguages();
        expect(languages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: 'en', label: 'English', default: true }),
            expect.objectContaining({ key: 'es', label: 'Spanish', installing: true }),
            expect.objectContaining({ key: 'zh', label: 'Chinese', installing: true }),
          ])
        );
      });

      it('should persist tenant language fields and not catalog fields', async () => {
        await createSut().execute({
          languages: [
            {
              key: 'es',
              label: 'Spanish',
              ISO639_3: 'spa',
              ISO639_1: 'es',
              localized_label: 'Español',
              elastic: 'spanish',
              translationAvailable: true,
            },
          ],
        });

        const [spanish] = (await readLanguages()).filter(language => language.key === 'es');
        expect(spanish).toEqual({ key: 'es', label: 'Spanish', installing: true });
      });

      it('should present catalog language fields on GET without storing them', async () => {
        await createSut().execute({ languages: [{ key: 'es', label: 'Spanish' }] });

        const settings = await withFlag(async () => SettingsQueryServiceFactory.default().get());
        expect(settings.languages?.find(language => language.key === 'es')).toEqual(
          expect.objectContaining({
            key: 'es',
            label: 'Spanish',
            ISO639_3: 'spa',
            localized_label: 'Español',
            installing: true,
          })
        );
      });

      it('should clone translations from the default language for each new language', async () => {
        await createSut().execute({
          languages: [
            { key: 'es', label: 'Spanish' },
            { key: 'zh', label: 'Chinese' },
          ],
        });

        const esCount = (
          await withFlag(async () =>
            TranslationsDataSourceFactory.default({
              transactionManager: TransactionManagerFactory.default(),
            }).getByLanguage('es')
          )
        ).length;
        const zhCount = (
          await withFlag(async () =>
            TranslationsDataSourceFactory.default({
              transactionManager: TransactionManagerFactory.default(),
            }).getByLanguage('zh')
          )
        ).length;

        expect(esCount).toBe(2);
        expect(zhCount).toBe(2);
      });

      it('should import predefined translations for each new language', async () => {
        await createSut().execute({
          languages: [
            { key: 'es', label: 'Spanish' },
            { key: 'zh', label: 'Chinese' },
          ],
        });

        expect(importPredefinedSpy).toHaveBeenCalledWith('es');
        expect(importPredefinedSpy).toHaveBeenCalledWith('zh');
      });

      it('should import predefined translations after the transaction commits', async () => {
        const callOrder: string[] = [];
        const trackingDispatcher = {
          cloneLanguageEntities: jest.fn().mockImplementation(async () => {
            callOrder.push('cloneLanguageEntities dispatched');
          }),
        } as unknown as Dispatcher;
        const trackingImportPredefined: ImportPredefinedTranslations = {
          execute: jest.fn().mockImplementation(async () => {
            callOrder.push('importPredefined called');
          }),
        };

        await createSut({
          dispatcher: trackingDispatcher,
          importPredefinedTranslations: trackingImportPredefined,
        }).execute({ languages: [{ key: 'es', label: 'Spanish' }] });

        expect(callOrder).toEqual(['cloneLanguageEntities dispatched', 'importPredefined called']);
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
        await createSut({ eventEmitter: { emit: emitSpy } }).execute({
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

        // importPredefined called only for the new language
        expect(importPredefinedSpy).toHaveBeenCalledTimes(1);
        expect(importPredefinedSpy).toHaveBeenCalledWith('es');

        // 'en' entry in settings unchanged (no duplicate)
        const enEntries = (await readLanguages()).filter(language => language.key === 'en');
        expect(enEntries).toHaveLength(1);
      });

      it('should do nothing when all requested languages are already installed', async () => {
        const emitSpy = jest.fn().mockResolvedValue(undefined);
        await createSut({ eventEmitter: { emit: emitSpy } }).execute({
          languages: [{ key: 'en', label: 'English' }],
        });

        expect(emitSpy).not.toHaveBeenCalled();
        expect(cloneLanguageEntitiesSpy).not.toHaveBeenCalled();
        expect(importPredefinedSpy).not.toHaveBeenCalled();
      });

      it('should return only the newly added languages, not already-installed ones', async () => {
        const result = await createSut().execute({
          languages: [
            { key: 'en', label: 'English' }, // already installed
            { key: 'es', label: 'Spanish' }, // new
            { key: 'zh', label: 'Chinese' }, // new
          ],
        });

        expect(result).toHaveLength(2);
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: 'es' }),
            expect.objectContaining({ key: 'zh' }),
          ])
        );
      });

      it('should return an empty array when all requested languages are already installed', async () => {
        const result = await createSut().execute({
          languages: [{ key: 'en', label: 'English' }],
        });

        expect(result).toEqual([]);
      });

      it('should roll back settings when cloneForLanguage fails', async () => {
        await withFlag(async () => {
          const translationsDS = TranslationsDataSourceFactory.default();
          const originalClone = translationsDS.cloneForLanguage.bind(translationsDS);
          jest.spyOn(translationsDS, 'cloneForLanguage').mockImplementation(async (from, to) => {
            await originalClone(from, to);
            throw new Error('clone failed');
          });

          await expect(
            AddLanguageUseCaseFactory.default({
              dispatcher: mockDispatcher,
              importPredefinedTranslations: mockImportPredefinedTranslations,
              translationsDS,
            }).execute({ languages: [{ key: 'es', label: 'Spanish' }] })
          ).rejects.toThrow('clone failed');
        });

        const languages = await readLanguages();
        if (postgresSettings) {
          expect(languages.map(language => language.key)).toEqual(
            expect.arrayContaining(['en', 'es'])
          );
        } else {
          expect(languages).toEqual([
            expect.objectContaining({ key: 'en', label: 'English', default: true }),
          ]);
        }

        if (!postgresTranslations) {
          const esCount = (
            await withFlag(async () => TranslationsDataSourceFactory.default().getByLanguage('es'))
          ).length;
          expect(esCount).toBe(0);
        }
      });

      it('should deduplicate input languages with the same key', async () => {
        const emitSpy = jest.fn().mockResolvedValue(undefined);
        await createSut({ eventEmitter: { emit: emitSpy } }).execute({
          languages: [
            { key: 'es', label: 'Spanish' },
            { key: 'es', label: 'Spanish' },
          ],
        });

        // Event emitted only once
        const languageAddedCalls = emitSpy.mock.calls.filter(
          ([event]) => event instanceof LanguageAddedEvent
        );
        expect(languageAddedCalls).toHaveLength(1);

        // Job dispatched with a single pair
        expect(cloneLanguageEntitiesSpy).toHaveBeenCalledWith({
          pairs: [{ from: 'en', to: 'es' }],
        });

        // importPredefined called once
        expect(importPredefinedSpy).toHaveBeenCalledTimes(1);
        expect(importPredefinedSpy).toHaveBeenCalledWith('es');

        // Only one 'es' entry in settings
        const esEntries = (await readLanguages()).filter(language => language.key === 'es');
        expect(esEntries).toHaveLength(1);
      });
    });
  });
});
