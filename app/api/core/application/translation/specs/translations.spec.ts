/* eslint-disable max-statements */
// eslint-disable-next-line no-restricted-imports
import * as fs from 'fs';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

import entities from '#api/entities/index.js';
import * as denormalize from '#api/entities/denormalize.js';
import { importPredefinedTranslations } from '#api/core/application/translation/ImportPredefinedTranslationsService.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import { LocaleTranslationInput } from '#api/core/application/translation/localeTranslationDto.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { Translation } from '#api/core/domain/translation/Translation.js';
import pages from '#api/pages/index.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { AddLanguageUseCaseFactory } from '#api/core/infrastructure/factories/AddLanguageUseCaseFactory.js';
import { SaveLocaleTranslationsUseCaseFactory } from '#api/core/infrastructure/factories/SaveLocaleTranslationsUseCaseFactory.js';
import { SaveTranslationEntriesUseCaseFactory } from '#api/core/infrastructure/factories/SaveTranslationEntriesUseCaseFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { UpdateEntriesByContextUseCaseFactory } from '#api/core/infrastructure/factories/UpdateEntriesByContextUseCaseFactory.js';
import * as setupSockets from '#api/socketio/setupSockets.js';
import { ContextType } from '#shared/translationSchema.js';
import { LanguageISO6391, LanguageSchema } from '#shared/types/commonTypes.js';
import { UITranslationNotAvailable } from '#api/i18n/defaultTranslations.js';

import { fixtures, dictionaryId } from './fixtures.js';
import { sortByLocale } from './sortByLocale.js';

const testConfigs = [
  { name: 'Mongo', postgresTranslations: false },
  { name: 'Postgres', postgresTranslations: true },
];

const createHelpers = (postgresTranslations: boolean) => {
  const withContext = <T>(fn: () => T) =>
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

  const withTranslationWrites = async (
    fn: (deps: {
      service: TranslationsService;
      translationsDS: TranslationsDataSource;
    }) => Promise<void>
  ) =>
    withContext(async () => {
      const transactionManager = TransactionManagerFactory.default();
      const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
      const service = TranslationsServiceFactory.default({ transactionManager });
      await transactionManager.run(async () => fn({ service, translationsDS }));
    });

  const getLegacyTranslations = async (
    query: { locale?: LanguageISO6391; context?: string } = {}
  ) => withContext(async () => TranslationsQueryServiceFactory.default().getLegacy(query));

  const saveLocaleTranslations = async (translation: LocaleTranslationInput) =>
    withContext(async () => SaveLocaleTranslationsUseCaseFactory.default().execute(translation));

  const updateEntriesByContext = async (
    contextId: string,
    keyValuePairsPerLanguage: { [x: string]: { [k: string]: string } }
  ) =>
    withContext(async () =>
      UpdateEntriesByContextUseCaseFactory.default().execute({
        contextId,
        keyValuePairsPerLanguage,
      })
    );

  const saveTranslationEntries = async (translations: Translation[]) =>
    withContext(async () =>
      SaveTranslationEntriesUseCaseFactory.default().execute({ translations })
    );

  const importPredefined = async (locale: string) =>
    withContext(async () => importPredefinedTranslations(locale));

  const getTranslationsByContext = async (context: string) =>
    withContext(async () => TranslationsQueryServiceFactory.default().getLegacy({ context }));

  const addLanguage = async (language: LanguageSchema) =>
    withContext(async () => {
      await AddLanguageUseCaseFactory.default().execute({ languages: [language] });
    });

  return {
    withTranslationWrites,
    getLegacyTranslations,
    saveLocaleTranslations,
    updateEntriesByContext,
    saveTranslationEntries,
    importPredefined,
    getTranslationsByContext,
    addLanguage,
  };
};

describe('translations', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, {
      postgres: true,
      postgresMirror: ['translationsV2'],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresTranslations }) => {
    const {
      withTranslationWrites,
      getLegacyTranslations,
      saveLocaleTranslations,
      updateEntriesByContext,
      saveTranslationEntries,
      importPredefined,
      getTranslationsByContext,
      addLanguage,
    } = createHelpers(postgresTranslations);

    beforeEach(async () => {
      jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();
      await testingEnvironment.setFixtures(fixtures);
    });

    describe('get()', () => {
      it('should return the translations', async () => {
        const [result] = await getLegacyTranslations({ locale: 'en' });

        expect(result).toMatchObject({
          contexts: [
            {
              type: 'Thesaurus' as 'Thesaurus',
              values: {
                Account: 'Account',
                Age: 'Age',
                Email: 'E-Mail',
                Password: 'Password',
                'dictionary 2': 'dictionary 2',
              },
            },
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: {
                Account: 'Account',
                Age: 'Age',
                Email: 'E-Mail',
                Library: 'Library',
                Password: 'Password',
              },
            },
          ],
          locale: 'en',
        });
      });
    });

    describe('v2StructureSave', () => {
      it('should save changed translations and propagate the changes', async () => {
        const initialEntity = (
          await testingEnvironment.runWithContext(async () =>
            entities.get({ language: 'es', sharedId: 'entity1' })
          )
        )[0];
        const translationsToSave = [
          new Translation('Password', 'Changed Password ES', 'es', {
            id: dictionaryId.toString(),
            type: 'Thesaurus',
            label: 'Dictionary',
          }),
        ];

        await saveTranslationEntries(translationsToSave);
        const updatedTranslations = await getTranslationsByContext(dictionaryId.toString());
        const esContext = updatedTranslations
          .find(t => t.locale === 'es')
          ?.contexts?.find(c => c.id === dictionaryId.toString());
        expect(esContext?.values?.Password).toBe('Changed Password ES');

        const updatedEntity = (
          await testingEnvironment.runWithContext(async () =>
            entities.get({ language: 'es', sharedId: 'entity1' })
          )
        )[0];
        initialEntity.metadata!.Dictionary![0].label = 'Changed Password ES';
        expect(updatedEntity).toEqual(initialEntity);
      });
    });

    describe('save()', () => {
      it('should save the translation and return it', async () => {
        const result = await saveLocaleTranslations({ locale: 'fr' });
        expect(result.locale).toBe('fr');
      });

      it('should accept partial updates as key/value maps', async () => {
        await saveLocaleTranslations({
          locale: 'en',
          contexts: [
            {
              id: 'System',
              values: { Password: 'edited Password' },
            },
            {
              id: dictionaryId.toString(),
              values: { Age: 'edited Age' },
            },
          ],
        });

        const [result] = await getLegacyTranslations({ locale: 'en' });
        expect(result.contexts!.find(c => c.id === dictionaryId.toString())?.values.Age).toBe(
          'edited Age'
        );
        expect(result.contexts!.find(c => c.id === 'System')?.values.Password).toBe(
          'edited Password'
        );
      });

      describe('when saving a dictionary context', () => {
        afterEach(() => {
          jest.spyOn(denormalize, 'denormalizeThesauriLabelInMetadata').mockRestore();
        });
        it('should propagate translation changes to entities denormalized label', async () => {
          const renameSpy = jest
            .spyOn(denormalize, 'denormalizeThesauriLabelInMetadata')
            .mockResolvedValue(undefined as never);
          renameSpy.mockClear();

          await saveLocaleTranslations({
            locale: 'en',
            contexts: [
              {
                id: dictionaryId.toString(),
                type: 'Thesaurus',
                values: {
                  'dictionary 2': 'new name',
                  Password: 'Password',
                  Account: 'Account',
                  Email: 'E-Mail',
                  Age: 'Age changed',
                },
              },
            ],
          });

          expect(denormalize.denormalizeThesauriLabelInMetadata).toHaveBeenLastCalledWith(
            'age id',
            'Age changed',
            dictionaryId.toString(),
            'en'
          );
        });

        it('should propagate child thesaurus translation changes to entities denormalized label', async () => {
          await testingEnvironment.db.getCollection('dictionaries')?.updateOne(
            { _id: dictionaryId },
            {
              $set: {
                values: [
                  {
                    id: 'parent_id',
                    label: 'Parent',
                    values: [{ id: 'child_id', label: 'Age' }],
                  },
                ],
              },
            }
          );

          const renameSpy = jest
            .spyOn(denormalize, 'denormalizeThesauriLabelInMetadata')
            .mockResolvedValue(undefined as never);
          renameSpy.mockClear();

          await saveLocaleTranslations({
            locale: 'en',
            contexts: [
              {
                id: dictionaryId.toString(),
                type: 'Thesaurus',
                values: {
                  Age: 'Age changed in child',
                },
              },
            ],
          });

          expect(denormalize.denormalizeThesauriLabelInMetadata).toHaveBeenCalledWith(
            'child_id',
            'Age changed in child',
            dictionaryId.toString(),
            'en'
          );
        });

        it('should propagate duplicated child labels across different parents', async () => {
          await testingEnvironment.db.getCollection('dictionaries')?.updateOne(
            { _id: dictionaryId },
            {
              $set: {
                values: [
                  {
                    id: 'in_court',
                    label: 'in court',
                    values: [
                      { id: 'yes_in_court', label: 'Age' },
                      { id: 'no_in_court', label: 'Email' },
                    ],
                  },
                  {
                    id: 'in_government',
                    label: 'in government',
                    values: [
                      { id: 'yes_in_government', label: 'Age' },
                      { id: 'no_in_government', label: 'Email' },
                    ],
                  },
                ],
              },
            }
          );

          const renameSpy = jest
            .spyOn(denormalize, 'denormalizeThesauriLabelInMetadata')
            .mockResolvedValue(undefined as never);
          renameSpy.mockClear();

          await saveLocaleTranslations({
            locale: 'en',
            contexts: [
              {
                id: dictionaryId.toString(),
                type: 'Thesaurus',
                values: {
                  Age: 'Yes changed',
                  Email: 'No changed',
                },
              },
            ],
          });

          expect(renameSpy).toHaveBeenCalledWith(
            'yes_in_court',
            'Yes changed',
            dictionaryId.toString(),
            'en'
          );
          expect(renameSpy).toHaveBeenCalledWith(
            'yes_in_government',
            'Yes changed',
            dictionaryId.toString(),
            'en'
          );
          expect(renameSpy).toHaveBeenCalledWith(
            'no_in_court',
            'No changed',
            dictionaryId.toString(),
            'en'
          );
          expect(renameSpy).toHaveBeenCalledWith(
            'no_in_government',
            'No changed',
            dictionaryId.toString(),
            'en'
          );
          expect(renameSpy).toHaveBeenCalledTimes(4);
        });
      });
    });

    describe('updateEntries', () => {
      it('should update the entries', async () => {
        await updateEntriesByContext('System', {
          en: { Password: 'Passphrase', Age: 'Years Old' },
        });

        const result = await getLegacyTranslations({ locale: 'en' });

        expect(result[0].contexts?.find(c => c.id === 'System')?.values).toMatchObject({
          Password: 'Passphrase',
          Account: 'Account',
          Email: 'E-Mail',
          Age: 'Years Old',
        });
      });

      it('should throw an error on if trying to update missing keys', async () => {
        try {
          await updateEntriesByContext('System', {
            en: { Key: 'english_value', OtherKey: 'other_english_value' },
            es: { Key: 'spanish_value' },
          });
          fail('Should throw error.');
        } catch (error) {
          expect(error.message).toBe(
            'Process is trying to update missing translation keys: en - System - Key,OtherKey.'
          );
        }
      });

      it('should not fail when trying to update a nonexisting language', async () => {
        await updateEntriesByContext('System', {
          en: { Password: 'Passphrase', Age: 'Years Old' },
          es: { Password: 'Password in Spanish', Age: 'Age in Spanish' },
          fr: { Password: 'mot de masse', Age: 'âge' },
        });

        const [en] = await getLegacyTranslations({ locale: 'en' });
        const [es] = await getLegacyTranslations({ locale: 'es' });

        expect(en.contexts?.find(c => c.id === 'System')?.values).toMatchObject({
          Password: 'Passphrase',
          Account: 'Account',
          Email: 'E-Mail',
          Age: 'Years Old',
        });
        expect(es.contexts?.find(c => c.id === 'System')?.values).toMatchObject({
          Password: 'Password in Spanish',
          Account: 'Cuenta',
          Email: 'Correo electronico',
          Age: 'Age in Spanish',
        });
      });
    });

    describe('addContext()', () => {
      it('should add a context with its values', async () => {
        const values = { Name: 'Name', Surname: 'Surname' };
        await withTranslationWrites(async ({ service }) =>
          service.createContext({ id: 'context_id', label: 'context_name', type: 'Entity' }, values)
        );

        const translated = await getLegacyTranslations();
        const createdEn = translated
          .find(t => t.locale === 'en')
          ?.contexts?.find(c => c.id === 'context_id');
        const createdEs = translated
          .find(t => t.locale === 'es')
          ?.contexts?.find(c => c.id === 'context_id');

        expect(createdEn?.values).toEqual(values);
        expect(createdEn?.type).toEqual(ContextType.entity);
        expect(createdEs?.values).toEqual(values);
        expect(createdEs?.type).toEqual(ContextType.entity);
      });
    });

    describe('deleteContext()', () => {
      it('should delete a context and its values', async () => {
        await withTranslationWrites(async ({ translationsDS }) =>
          translationsDS.deleteByContextId('System')
        );

        const translated = await getLegacyTranslations();

        expect(translated[0].contexts?.length).toBe(1);
        expect(translated[0].contexts?.[0].type).toBe('Thesaurus');
        expect(translated[1].contexts?.[0].type).toBe('Thesaurus');
        expect(translated[1].contexts?.length).toBe(1);
      });
    });

    describe('updateContext()', () => {
      it('should change the value of a translation when changing the key if the locale is the default one', async () => {
        await withTranslationWrites(async ({ service }) =>
          service.updateContext({
            context: { id: dictionaryId.toString(), label: 'new context name', type: 'Thesaurus' },
            keyChanges: {
              'property should only change value on default languge': 'new property name',
            },
            keysToDelete: [],
            valueChanges: {},
          })
        );

        const [esTranslations] = await getLegacyTranslations({ locale: 'es' });
        const esThesauriContext = (esTranslations.contexts || []).find(c => c.type === 'Thesaurus');
        expect(esThesauriContext?.values).toMatchObject({
          'new property name': 'property',
        });

        const [zhTranslations] = await getLegacyTranslations({ locale: 'zh' });
        const zhThesauriContext = (zhTranslations.contexts || []).find(c => c.type === 'Thesaurus');
        expect(zhThesauriContext?.values).toMatchObject({
          'new property name': 'property',
        });

        const [enTranslations] = await getLegacyTranslations({ locale: 'en' });
        const enThesauriContext = (enTranslations.contexts || []).find(c => c.type === 'Thesaurus');
        expect(enThesauriContext?.values).toMatchObject({
          'new property name': 'new property name',
        });
      });
      it('should properly change context name, key names, values for the keys changed and deleteProperties, and create new values as new translations if key does not exists', async () => {
        await withTranslationWrites(async ({ service }) =>
          service.updateContext({
            context: { id: dictionaryId.toString(), label: 'new context name', type: 'Thesaurus' },
            keyChanges: { Account: 'New Account Key', Password: 'New Password key' },
            keysToDelete: ['Age', 'Email'],
            valueChanges: { 'new key': 'new value' },
          })
        );

        const [enTranslations] = await getLegacyTranslations({ locale: 'en' });
        const enThesauriContext = (enTranslations.contexts || []).find(c => c.type === 'Thesaurus');

        expect(enThesauriContext?.label).toBe('new context name');
        expect(enThesauriContext?.values).toEqual({
          'property should only change value on default languge': 'property',
          'New Account Key': 'New Account Key',
          'New Password key': 'New Password key',
          'new key': 'new value',
          'dictionary 2': 'dictionary 2',
        });

        const [esTranslations] = await getLegacyTranslations({ locale: 'es' });
        const esThesauriContext = (esTranslations.contexts || []).find(c => c.type === 'Thesaurus');

        expect(esThesauriContext?.label).toBe('new context name');
        expect(esThesauriContext?.values).toEqual({
          'property should only change value on default languge': 'property',
          'New Account Key': 'Cuenta',
          'New Password key': 'Contraseña',
          'new key': 'new value',
          'dictionary 2': 'dictionary 2',
        });
      });

      it('should update a context with its values', async () => {
        const keyNameChanges = { Password: 'Pass', Account: 'Acc' };
        const deletedProperties = ['Age'];
        const values = {
          Pass: 'Pass',
          Email: 'Email',
          Name: 'Names',
          Interface: 'Interfaces',
        };

        await withTranslationWrites(async ({ service }) =>
          service.updateContext({
            context: { id: 'System', label: 'Interface', type: 'Uwazi UI' },
            keyChanges: keyNameChanges,
            keysToDelete: deletedProperties,
            valueChanges: values,
          })
        );

        const translated = await getLegacyTranslations();
        const enSystem = translated
          .find(t => t.locale === 'en')
          ?.contexts?.find(c => c.id === 'System');
        const esSystem = translated
          .find(t => t.locale === 'es')
          ?.contexts?.find(c => c.id === 'System');

        expect(enSystem?.label).toBe('Interface');
        expect(enSystem?.values.Pass).toBe('Pass');
        expect(enSystem?.values.Interface).toBe('Interfaces');
        expect(esSystem?.values.Pass).toBe('Contraseña');

        expect(enSystem?.values.Age).not.toBeDefined();
        expect(esSystem?.values.Age).not.toBeDefined();
        expect(enSystem?.values.System).not.toBeDefined();
        expect(esSystem?.values.System).not.toBeDefined();

        expect(enSystem?.values.Name).toBe('Names');
        expect(esSystem?.values.Name).toBe('Names');
      });
    });

    describe('addLanguage', () => {
      it('should clone translations of default language and change language to the one added', async () => {
        await addLanguage({ key: 'fr', label: 'french' });
        const allTranslations = await getLegacyTranslations();

        const frTranslation = allTranslations.find(t => t.locale === 'fr');
        const defaultTranslation = allTranslations.find(t => t.locale === 'en') || { contexts: [] };

        expect(frTranslation?.contexts?.[0].values).toEqual(
          defaultTranslation.contexts?.[0].values
        );
      });

      describe('when the language already exists', () => {
        it('should not clone it again', async () => {
          await addLanguage({ key: 'fr', label: 'french' });

          const firstEntitiesCount = (
            await testingEnvironment.runWithContext(async () => entities.get({ language: 'fr' }))
          ).length;
          const firstPagesCount = (await pages.get({ language: 'fr' })).length;

          await addLanguage({ key: 'fr', label: 'french' });

          const settingsLanguages = await testingEnvironment.runWithContext(async () =>
            SettingsDataSourceFactory.default().getLanguageKeys()
          );
          expect(settingsLanguages).toEqual(['es', 'en', 'zh', 'fr']);

          const allTranslations = await getLegacyTranslations();
          const frTranslations = allTranslations.filter(t => t.locale === 'fr');
          expect(frTranslations.length).toBe(1);

          const secondEntitiesCount = (
            await testingEnvironment.runWithContext(async () => entities.get({ language: 'fr' }))
          ).length;
          const secondPagesCount = (await pages.get({ language: 'fr' })).length;
          expect(firstEntitiesCount).toBe(secondEntitiesCount);
          expect(firstPagesCount).toBe(secondPagesCount);
        });
      });
    });

    describe('removeLanguage', () => {
      it('should remove translation for the language passed', async () => {
        await testingEnvironment.runWithContext(async () =>
          SettingsDataSourceFactory.default().deleteLanguage('es')
        );
        await withTranslationWrites(async ({ translationsDS }) =>
          translationsDS.deleteByLanguage('es')
        );
        const allTranslations = await getLegacyTranslations();

        expect(allTranslations.sort(sortByLocale)).toMatchObject([
          { locale: 'en' },
          { locale: 'zh' },
        ]);
      });
    });

    describe('import predefined translation csv', () => {
      it('should download a translations csv based on iso key and import it when translation is available', async () => {
        const readFileMock = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(
          Buffer.from(`Key, Español
        Password, Password traducida
        Account, Account traducida
        Age, Age traducida`)
        );

        await importPredefined('es');

        const result = await getLegacyTranslations();
        const ESTranslations =
          (result.find(t => t.locale === 'es')?.contexts || []).find(c => c.label === 'System')
            ?.values || {};

        expect(ESTranslations.Password).toBe('Password traducida');
        expect(ESTranslations.Account).toBe('Account traducida');
        expect(ESTranslations.Age).toBe('Age traducida');

        readFileMock.mockRestore();
      });

      it('should throw error when translation is not available', async () => {
        await expect(importPredefined('non-existent')).rejects.toBeInstanceOf(
          UITranslationNotAvailable
        );

        const result = await getLegacyTranslations();
        const ZHTranslations =
          (result.find(t => t.locale === 'zh')?.contexts || []).find(c => c.label === 'System')
            ?.values || {};

        expect(ZHTranslations.Password).toBe('Password');
        expect(ZHTranslations.Account).toBe('Account');
        expect(ZHTranslations.Age).toBe('Age');
      });
    });
  });
});
