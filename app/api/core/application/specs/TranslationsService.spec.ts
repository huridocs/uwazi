import { TestUtils } from '#api/common.v2/utils/Test.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import { prepareLocaleTranslation } from '#api/core/application/translation/localeTranslationDto.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { ValidateTranslationsService } from '#api/core/application/translation/ValidateTranslationsService.js';
import { Translation } from '#api/core/domain/translation/Translation.js';

const context = { id: 'ctx-1', label: 'Context', type: 'Entity' as const };

const entry = (overrides: Partial<{ key: string; value: string; language: 'en' | 'es' }> = {}) => ({
  language: overrides.language ?? ('en' as const),
  key: overrides.key ?? 'Title',
  value: overrides.value ?? 'Title',
  context,
});

const createSut = (isRunning = true) => {
  const transactionManager = TestUtils.mockClass<TransactionManager>({
    isRunning: jest.fn().mockReturnValue(isRunning),
    run: jest.fn(),
  });
  const translationsDS = TestUtils.mockClass<TranslationsDataSource>({
    insert: jest.fn().mockImplementation(async models => models),
    upsert: jest.fn().mockImplementation(async models => models),
    calculateNonexistentKeys: jest.fn().mockResolvedValue([]),
    deleteByContextId: jest.fn().mockResolvedValue(undefined),
    deleteByLanguage: jest.fn().mockResolvedValue(undefined),
    getContext: jest.fn(),
    updateContext: jest.fn().mockResolvedValue(undefined),
  });
  const settingsDS = TestUtils.mockClass<SettingsDataSource>({
    getLanguageKeys: jest.fn().mockResolvedValue(['en', 'es']),
    getDefaultLanguageKey: jest.fn().mockResolvedValue('en'),
  });
  const validateTranslations = TestUtils.mockClass<ValidateTranslationsService>({
    languagesExist: jest.fn().mockResolvedValue(undefined),
    translationsWillExistsInAllLanguages: jest.fn().mockResolvedValue(undefined),
  });

  return {
    sut: new TranslationsService({
      transactionManager,
      translationsDS,
      settingsDS,
      validateTranslations,
    }),
    transactionManager,
    translationsDS,
    settingsDS,
    validateTranslations,
  };
};

describe('TranslationsService', () => {
  describe('prepareLocaleTranslation', () => {
    it('should require a locale', () => {
      expect(() => prepareLocaleTranslation({ contexts: [] })).toThrow(
        'translation to save should have a locale'
      );
    });

    it('should convert indexed context values to a list', () => {
      const prepared = prepareLocaleTranslation({
        locale: 'en',
        contexts: [{ id: 'ctx-1', label: 'Context', type: 'Entity', values: { Title: 'Title' } }],
      });

      expect(prepared.contexts?.[0].values).toEqual([{ key: 'Title', value: 'Title' }]);
    });

    it('should reject duplicate keys in a context', () => {
      expect(() =>
        prepareLocaleTranslation({
          locale: 'en',
          contexts: [
            {
              id: 'ctx-1',
              label: 'Context',
              type: 'Entity',
              values: [
                { key: 'Title', value: 'A' },
                { key: 'Title', value: 'B' },
              ],
            },
          ],
        })
      ).toThrow(/repeated translation key Title/);
    });
  });

  describe('ambient transaction requirement', () => {
    it.each([
      ['insertEntries', async (sut: TranslationsService) => sut.insertEntries([entry()])],
      ['upsertEntries', async (sut: TranslationsService) => sut.upsertEntries([entry()])],
      ['saveEntries', async (sut: TranslationsService) => sut.saveEntries([entry()])],
      [
        'persistLocale',
        async (sut: TranslationsService) =>
          sut.persistLocale({
            locale: 'en',
            contexts: [
              {
                id: 'ctx-1',
                label: 'Context',
                type: 'Entity',
                values: [{ key: 'Title', value: 'T' }],
              },
            ],
          }),
      ],
      ['deleteByContextId', async (sut: TranslationsService) => sut.deleteByContextId('ctx-1')],
      ['deleteByLanguage', async (sut: TranslationsService) => sut.deleteByLanguage('en')],
    ])('should throw when %s is called outside a transaction', async (_name, run) => {
      const { sut } = createSut(false);
      await expect(run(sut)).rejects.toThrow('This operation must be called within a transaction');
    });

    it('should throw when createContext persists outside a transaction', async () => {
      const { sut } = createSut(false);
      await expect(sut.createContext(context, { Title: 'Title' })).rejects.toThrow(
        'This operation must be called within a transaction'
      );
    });

    it('should throw when updateContext persists outside a transaction', async () => {
      const { sut, translationsDS } = createSut(false);
      translationsDS.getContext = jest.fn();
      await expect(
        sut.updateContext({
          context,
          keyChanges: {},
          keysToDelete: [],
          valueChanges: {},
        })
      ).rejects.toThrow('This operation must be called within a transaction');
    });
  });

  describe('when a transaction is running', () => {
    it('should validate and insert entries', async () => {
      const { sut, translationsDS, validateTranslations } = createSut(true);
      const translations = [entry({ language: 'en' }), entry({ language: 'es', value: 'Título' })];

      await sut.insertEntries(translations);

      expect(validateTranslations.languagesExist).toHaveBeenCalledWith(translations);
      expect(validateTranslations.translationsWillExistsInAllLanguages).toHaveBeenCalledWith(
        translations
      );
      expect(translationsDS.insert).toHaveBeenCalledWith([
        expect.any(Translation),
        expect.any(Translation),
      ]);
    });

    it('should reject upsert when keys are missing', async () => {
      const { sut, translationsDS } = createSut(true);
      translationsDS.calculateNonexistentKeys = jest.fn().mockResolvedValue(['Missing']);

      await expect(sut.upsertEntries([entry({ key: 'Missing' })])).rejects.toThrow(
        /update missing translation keys/
      );
      expect(translationsDS.upsert).not.toHaveBeenCalled();
    });

    it('should partition saveEntries into create and update', async () => {
      const { sut, translationsDS } = createSut(true);
      translationsDS.calculateNonexistentKeys = jest
        .fn()
        .mockImplementation(async (_contextId: string, keys: string[]) =>
          keys.filter(key => key === 'New')
        );

      await sut.saveEntries([
        entry({ key: 'Title', value: 'Updated' }),
        entry({ key: 'New', value: 'New' }),
      ]);

      expect(translationsDS.insert).toHaveBeenCalledWith([
        expect.objectContaining({ key: 'New', value: 'New' }),
      ]);
      expect(translationsDS.upsert).toHaveBeenCalledWith([
        expect.objectContaining({ key: 'Title', value: 'Updated' }),
      ]);
    });

    it('should no-op saveEntries for an empty list', async () => {
      const { sut, translationsDS } = createSut(true);

      await sut.saveEntries([]);

      expect(translationsDS.calculateNonexistentKeys).not.toHaveBeenCalled();
      expect(translationsDS.insert).not.toHaveBeenCalled();
      expect(translationsDS.upsert).not.toHaveBeenCalled();
    });

    it('should create context values for every installed language', async () => {
      const { sut, translationsDS, settingsDS } = createSut(true);

      await sut.createContext(context, { Title: 'Title', Name: 'Name' });

      expect(settingsDS.getLanguageKeys).toHaveBeenCalled();
      const inserted = (translationsDS.insert as jest.Mock).mock.calls[0][0];
      expect(inserted).toHaveLength(4);
      expect(inserted).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ language: 'en', key: 'Title' }),
          expect.objectContaining({ language: 'es', key: 'Title' }),
          expect.objectContaining({ language: 'en', key: 'Name' }),
          expect.objectContaining({ language: 'es', key: 'Name' }),
        ])
      );
    });

    it('should delete by context and language', async () => {
      const { sut, translationsDS } = createSut(true);

      await sut.deleteByContextId('ctx-1');
      await sut.deleteByLanguage('es');

      expect(translationsDS.deleteByContextId).toHaveBeenCalledWith('ctx-1');
      expect(translationsDS.deleteByLanguage).toHaveBeenCalledWith('es');
    });
  });
});
