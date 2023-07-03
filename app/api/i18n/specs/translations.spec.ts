import db from 'api/utils/testing_db';

import thesauri from 'api/thesauri/thesauri.js';
import { ContextType } from 'shared/translationSchema';
// eslint-disable-next-line node/no-restricted-import
import settings from 'api/settings';
import * as fs from 'fs';
import { TranslationType } from 'shared/translationType';
import { UITranslationNotAvailable } from '../defaultTranslations';
import translations, { IndexedTranslations } from '../translations';
import fixtures, { dictionaryId, englishTranslation } from './fixtures';
import { sortByLocale } from './sortByLocale';
import { migrateTranslationsToV2 } from '../v2_support';

describe('translations', () => {
  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures);
    await migrateTranslationsToV2();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('get()', () => {
    it('should return the translations', async () => {
      const [result] = await translations.get({ locale: 'en' });

      expect(result).toMatchObject({
        contexts: [
          {
            type: 'Thesaurus',
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

  describe('save()', () => {
    it('should save the translation and return it', async () => {
      const result = await translations.save({ locale: 'fr' });
      expect(result.locale).toBe('fr');
    });

    it('should accept partial updates in both, array format and map format', async () => {
      await translations.save({
        locale: 'en',
        contexts: [
          {
            id: 'System',
            // @ts-ignore
            values: [{ key: 'Password', value: 'edited Password' }],
          },
          {
            id: dictionaryId.toString(),
            values: { Age: 'edited Age' },
          },
        ],
      });

      const [result] = await translations.get({ locale: 'en' });
      expect(result.contexts!.find(c => c.id === dictionaryId.toString())?.values.Age).toBe(
        'edited Age'
      );
      expect(result.contexts!.find(c => c.id === 'System')?.values.Password).toBe(
        'edited Password'
      );
    });

    describe('when saving a dictionary context', () => {
      it('should propagate translation changes to entities denormalized label', async () => {
        jest
          .spyOn(thesauri, 'renameThesaurusInMetadata')
          .mockImplementation(async () => Promise.resolve());

        await translations.save({
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

        expect(thesauri.renameThesaurusInMetadata).toHaveBeenLastCalledWith(
          'age id',
          'Age changed',
          dictionaryId.toString(),
          'en'
        );
      });
    });
  });

  it('should not allow duplicate keys', async () => {
    try {
      await translations.save({
        locale: 'fr',
        contexts: [
          {
            values: [
              { key: 'repeated_key', value: 'first_value' },
              { key: 'unique_key', value: 'unique_value' },
              { key: 'repeated_key', value: 'second_value' },
            ],
          },
        ],
      });
      fail('Should throw error.');
    } catch (error) {
      expect(error.message).toContain('Process is trying to save repeated translation key');
    }

    try {
      await translations.save({
        locale: 'en',
        contexts: [
          {
            id: dictionaryId.toString(),
            // eslint-disable-next-line max-lines
            values: [
              { key: 'repeated_key', value: 'first_value' },
              { key: 'unique_key', value: 'unique_value' },
              { key: 'repeated_key', value: 'second_value' },
            ],
          },
        ],
      });
      fail('Should throw error.');
    } catch (error) {
      expect(error.message).toContain('Process is trying to save repeated translation key');
    }
  });

  describe('updateEntries', () => {
    it('should update the entries', async () => {
      await translations.updateEntries('System', {
        en: { Password: 'Passphrase', Age: 'Years Old' },
      });

      const result = await translations.get({ locale: 'en' });

      expect(result[0].contexts?.[1].values).toMatchObject({
        Password: 'Passphrase',
        Account: 'Account',
        Email: 'E-Mail',
        Age: 'Years Old',
      });
    });

    it('should throw an error on if trying to update missing keys', async () => {
      try {
        await translations.updateEntries('System', {
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
      await translations.updateEntries('System', {
        en: { Password: 'Passphrase', Age: 'Years Old' },
        es: { Password: 'Password in Spanish', Age: 'Age in Spanish' },
        fr: { Password: 'mot de masse', Age: 'âge' },
      });

      const [en] = await translations.get({ locale: 'en' });
      const [es] = await translations.get({ locale: 'es' });

      expect(en.contexts?.[1].values).toMatchObject({
        Password: 'Passphrase',
        Account: 'Account',
        Email: 'E-Mail',
        Age: 'Years Old',
      });
      expect(es.contexts?.[1].values).toMatchObject({
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
      const result = await translations.addContext(
        'context_id',
        'context_name',
        values,
        ContextType.entity
      );

      expect(result).toBe('ok');

      const translated = await translations.get();

      expect(translated.find(t => t.locale === 'en')?.contexts?.[2].values).toEqual(values);
      expect(translated.find(t => t.locale === 'en')?.contexts?.[2].type).toEqual(
        ContextType.entity
      );
      expect(translated.find(t => t.locale === 'es')?.contexts?.[2].values).toEqual(values);
      expect(translated.find(t => t.locale === 'es')?.contexts?.[2].type).toEqual(
        ContextType.entity
      );
    });
  });

  describe('deleteContext()', () => {
    it('should delete a context and its values', async () => {
      const result = await translations.deleteContext('System');

      expect(result).toBe('ok');

      const translated = await translations.get();

      expect(translated[0].contexts?.length).toBe(1);
      expect(translated[1].contexts?.length).toBe(1);
    });
  });

  describe('updateContext()', () => {
    it('should add values if the context values are undefined', async () => {
      const keyNameChanges = { Password: 'Pass', Account: 'Acc', System: 'Interface' };
      const deletedProperties = ['Age'];
      const context = {
        Pass: 'Pass',
        Acc: 'Acc',
        Email: 'Email',
        Name: 'Name',
        Interface: 'Interface',
      };

      const result = await translations.updateContext(
        { id: 'System', label: 'Menu', type: 'Uwazi UI' },
        keyNameChanges,
        deletedProperties,
        context
      );

      expect(result).toBe('ok');
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

      const result = await translations.updateContext(
        { id: 'System', label: 'Interface', type: 'Uwazi UI' },
        keyNameChanges,
        deletedProperties,
        values
      );

      expect(result).toBe('ok');

      const translated = await translations.get();
      const en = translated.find(t => t.locale === 'en');
      const es = translated.find(t => t.locale === 'es');

      expect(en?.contexts?.[1].label).toBe('Interface');
      expect(en?.contexts?.[1].values.Pass).toBe('Pass');
      expect(en?.contexts?.[1].values.Interface).toBe('Interfaces');
      expect(es?.contexts?.[1].values.Pass).toBe('Contraseña');

      expect(en?.contexts?.[1].values.Age).not.toBeDefined();
      expect(es?.contexts?.[1].values.Age).not.toBeDefined();
      expect(en?.contexts?.[1].values.System).not.toBeDefined();
      expect(es?.contexts?.[1].values.System).not.toBeDefined();

      expect(en?.contexts?.[1].values.Name).toBe('Names');
      expect(es?.contexts?.[1].values.Name).toBe('Names');
    });
  });

  describe('addLanguage', () => {
    it('should clone translations of default language and change language to the one added', async () => {
      await settings.addLanguage({ key: 'fr', label: 'french' });
      await translations.addLanguage('fr');
      const allTranslations = await translations.get();

      const frTranslation = allTranslations.find(t => t.locale === 'fr');
      const defaultTranslation = allTranslations.find(t => t.locale === 'en');

      expect(frTranslation.contexts).toMatchObject(defaultTranslation.contexts);
    });

    describe('when translation already exists', () => {
      it('should not clone it again', async () => {
        await settings.addLanguage({ key: 'fr', label: 'french' });
        await translations.addLanguage('fr');
        await translations.addLanguage('fr');
        const allTranslations = await translations.get();

        const frTranslations = allTranslations.filter(t => t.locale === 'fr');

        expect(frTranslations.length).toBe(1);
      });
    });
  });

  describe('removeLanguage', () => {
    it('should remove translation for the language passed', async () => {
      await settings.deleteLanguage('es');
      await translations.removeLanguage('es');
      const allTranslations = await translations.get();

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

      await translations.importPredefined('es');

      const result = await translations.get();
      const ESTranslations =
        (result.find(t => t.locale === 'es')?.contexts || []).find(c => c.label === 'System')
          ?.values || {};

      expect(ESTranslations.Password).toBe('Password traducida');
      expect(ESTranslations.Account).toBe('Account traducida');
      expect(ESTranslations.Age).toBe('Age traducida');

      readFileMock.mockRestore();
    });

    it('should throw error when translation is not available', async () => {
      const readFileMock = jest
        .spyOn(fs.promises, 'readFile')
        .mockRejectedValue({ code: 'ENOENT' });

      await expect(translations.importPredefined('zh')).rejects.toThrowError(
        UITranslationNotAvailable
      );

      const result = await translations.get();
      const ZHTranslations =
        (result.find(t => t.locale === 'zh')?.contexts || []).find(c => c.label === 'System')
          ?.values || {};

      expect(ZHTranslations.Password).toBe('Password');
      expect(ZHTranslations.Account).toBe('Account');
      expect(ZHTranslations.Age).toBe('Age');

      readFileMock.mockRestore();
    });
  });
});
